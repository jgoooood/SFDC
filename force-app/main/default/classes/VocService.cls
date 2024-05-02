public with sharing class VocService {
    //////////////////////////////////// VoC ////////////////////////////////////
    // 로그인유저 프로필 조회
    @AuraEnabled(cacheable=true)
    public static String getUserProfile() {
        User loginUser = [SELECT Profile.Name FROM User WHERE Id = :UserInfo.getUserId()];
        System.debug(loginUser.Profile.Name);
        return loginUser.Profile.Name;
    }

    //검색어 VoC내역 조회
    @AuraEnabled(cacheable=true scope='global')
    public static List<VoC__c> getVocs(String searchTerm, Integer pageNumber, Integer pageSize){
        searchTerm = searchTerm.trim();
        Integer offset = (pageNumber - 1) * pageSize;
        
        if(searchTerm == null || searchTerm.length() == 0) {
            return [SELECT Id, VoC_Type__c, ContactId__r.Name, ContactId__r.Phone, VoC_Product_Name__c, VoC_Subject__c, VoC_Start_Date__c, VoC_End_Date__c, VoC_Status__c
            FROM VoC__c
            ORDER BY CreatedDate DESC
            LIMIT :pageSize OFFSET :offset];
        } else {
            searchTerm = '%' + searchTerm + '%';
            return [SELECT Id, VoC_Type__c, ContactId__r.Name, ContactId__r.Phone, VoC_Product_Name__c, VoC_Subject__c, VoC_Start_Date__c, VoC_End_Date__c, VoC_Status__c
            FROM VoC__c
            WHERE ContactId__r.Phone  LIKE :searchTerm 
            ORDER BY CreatedDate DESC
            LIMIT :pageSize OFFSET :offset];
        }
        
    }
    
    //전체 voc 건수 조회
    @AuraEnabled(cacheable=true)
    public static Integer getTotalVocCount(String searchTerm) {
        Integer count = 0;
        searchTerm = searchTerm.trim();
        if(searchTerm == null || searchTerm.length() == 0) {
            count = [SELECT Count() FROM VoC__c];
            System.debug(count);
        } else {
            searchTerm = '%' + searchTerm + '%';
            count = [SELECT Count() FROM VoC__c WHERE ContactId__r.Phone LIKE :searchTerm];
            System.debug(count);
        }
        return count;
    }
    

    //고객 Id별 Phone 조회
    @AuraEnabled(cacheable=true)
    public static List<Contact> getContactPhone(Id ContactId) {
        System.debug(ContactId);
        // return [SELECT Phone FROM Contact WHERE Id = :ContactId LIMIT 1];
        return [SELECT Phone FROM Contact WHERE Id = :ContactId LIMIT 1];
    }

    //고객id에 따른 보유 제품목록 조회
    @AuraEnabled(cacheable=true)
    public static List<AggregateResult> getProdByContactId(Id ContactId){
        return [SELECT Product_Name__c
                FROM Sales__c
                WHERE Status__c ='구매' AND Contact__c = :ContactId
                GROUP BY Product_Name__c];
    }

    //선택한 VoC 삭제
    @AuraEnabled
    public static void deleteVocs(List<Id> vocIds){
        List<VoC__c> vocDelete = [SELECT Id FROM VoC__c WHERE Id IN :vocIds];
        try {
            delete vocDelete;
        } catch (Exception e) {
            System.debug(e.getMessage());
        }
    }

    //VoC count 업데이트
    @AuraEnabled
    public static void updateVocCount(List<VoC__c> vocList) {
        Set<Id> contactIds = new Set<Id>();

        for(VoC__c c : vocList) {
            if(c.ContactId__c != null) {
                contactIds.add(c.ContactId__c);
            }
        }

        List<Contact> cons = [SELECT Id, VoC_Count__c FROM Contact WHERE Id IN :contactIds];

        List<AggregateResult> vocResult = [SELECT ContactId__c, COUNT(Id) cnt
                                            FROM VoC__c
                                            WHERE ContactId__c IN :contactIds
                                            GROUP BY ContactId__c];

        List<Contact> updateContact = new List<Contact>();
        for(AggregateResult result : vocResult){
            Id contactId = (Id) result.get('ContactId__c');

            for (Contact con : cons) {
                if (con.Id == contactId) {
                    con.VoC_Count__c = (Integer) result.get('cnt');
                    updateContact.add(con);
                }
            }
        }
        update updateContact;
    }

    // VoC_Status__c필드 'Closed'면 End Date 자동입력
    @AuraEnabled
    public static void updateEndDate(List<VoC__c> vocList, Map<Id, VoC__c> oldMap){
        if(oldMap == null) {
            System.debug('신규등록시작');
        } else {
            System.debug('업데이트시작');
        }
        for(VoC__c v : vocList){
            // 'Closed' 상태로 설정된 경우만 확인
            boolean isClosed = 'Closed'.equals(v.VoC_Status__c);
            // oldMap이 null이 아니라면, 이전 상태가 'Closed'였는지 확인
            boolean wasClosed = oldMap != null && 'Closed'.equals(oldMap.get(v.Id).VoC_Status__c);
            // 상태가 'Closed'로 변경되었는지 확인 (신규 레코드 등록 포함)
            boolean changedToClosed = isClosed && (!wasClosed || oldMap == null);

            System.debug('상태종료? : ' + isClosed);
            System.debug('종료였음? : ' + wasClosed);
            System.debug('변경됐음? : ' + changedToClosed);
            if(changedToClosed) {
                v.VoC_End_Date__c = Datetime.now();
            }
        }
    }

    // VoC_Status__c필드 'Closed'면 고객 메일전송
    @AuraEnabled
    public static void mailToContact(List<VoC__c> vocList, Map<Id, VoC__c> oldMap){
        List<Messaging.SingleEmailMessage> emailsToSend = new List<Messaging.SingleEmailMessage>();

        // Trigger.new 리스트의 고객id 중복제거
        Set<Id> contactIds = new Set<Id>();
        for(VoC__c voc : vocList) {
            if(voc.ContactId__c != null) {
                contactIds.add(voc.ContactId__c);
            }
        }

        //고객 id로 이메일주소 조회
        Map<Id, Contact> emailMap = new Map<Id, Contact>([ SELECT Id, Name, Email FROM Contact 
                                                            WHERE Id IN :contactIds]);

        for(VoC__c v : vocList){
            boolean isClosed = v.VoC_Status__c == 'Closed';
            boolean wasClosed = oldMap != null && oldMap.get(v.Id).VoC_Status__c == 'Closed';
            boolean changedToClosed = oldMap != null && !wasClosed && isClosed;

            if(isClosed || changedToClosed) {
                Contact relatedContact = emailMap.get(v.ContactId__c);
                if(relatedContact != null && String.isNotBlank(relatedContact.Email)){
                    //메일 내용 생성
                    Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
                    mail.setToAddresses(new List<String>{relatedContact.Email});
                    mail.setSubject(relatedContact.Name+'님의 VoC 상담 종료 알림');
                    String body = '안녕하세요, ' + relatedContact.Name + '님.\n\n'
                                + '상담 내용이 다음과 같이 종료되었습니다. \n'
                                + '상담 유형 : ' + v.VoC_Type__c + '\n'
                                + '상담 제품 : ' + v.VoC_Product_Name__c + '\n'
                                + '상담 내용 : ' + v.VoC_Description__c;
                    mail.setPlainTextBody(body);

                    // 메일 리스트 추가
                    emailsToSend.add(mail);
                }
            }
        }

        if(!emailsToSend.isEmpty()){
            Messaging.sendEmail(emailsToSend);
        }
    }


    //////////////////////////////////// 판매점 ////////////////////////////////////
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccountByName(String accountName){
        return [SELECT Id FROM Account WHERE Name Like :accountName];
    }

    @AuraEnabled(cacheable=true scope='global')
    public static List<AggregateResult> getVocSalesByAccount(String searchTerm){
        searchTerm = searchTerm.trim();
        if(searchTerm == null || searchTerm.length() == 0) {
            return [SELECT Account__r.Name, SUM(Price__c) totalPrice 
                    FROM Sales__c 
                    WHERE Account__r.Name LIKE '%스톤헤드%' 
                    GROUP BY Account__r.Name 
                    ORDER BY SUM(Price__c) DESC];
        } else {
            searchTerm = '%' + searchTerm + '%';
            return [SELECT Account__r.Name, SUM(Price__c) totalPrice
                    FROM Sales__c 
                    WHERE Account__r.Name LIKE '%스톤헤드%' AND Account__r.Name LIKE :searchTerm
                    GROUP BY Account__r.Name 
                    ORDER BY SUM(Price__c) DESC];
            // return [SELECT Name, Owner.Name, Phone
            //         FROM Account
            //         WHERE Name LIKE :searchTerm
            //         ORDER BY Name DESC];
        }
    }

    // 판매내역 데이터반환
    @AuraEnabled(cacheable=true scope='global')
    public static List<Sales__c> getSalesByAccountId(String accountId, 
                                                    String searchProd,
                                                    String startDate,
                                                    String endDate,
                                                    Integer pageNumber, 
                                                    Integer pageSize){
         //페이징 변수
        Integer offset = (pageNumber - 1) * pageSize;

        //Date 변환
        Datetime formatStartDate = String.isNotBlank(startDate) ? Datetime.valueOf(startDate + ' 00:00:00') : null;
        Datetime formatEndDate = String.isNotBlank(endDate) ? Datetime.valueOf(endDate + ' 23:59:59') : null;

    
        System.debug('페이지size'+pageSize);
        System.debug('pageNumber'+pageNumber);
        System.debug('offset'+offset);

        //WHERE절
        String whereClause = '';
        String query = '';
        List<String> conditions = new List<String>();

        if (String.isNotBlank(accountId)) {
            conditions.add('Account__c = :accountId');
        }
        if (String.isNotBlank(searchProd)) {
            conditions.add('Product_Name__c = :searchProd');
        }
        if (String.isNotBlank(startDate)) {
            conditions.add('Sales_Date__c >= :formatStartDate');
        }
        if (String.isNotBlank(endDate)) {
            conditions.add('Sales_Date__c <= :formatEndDate');
        }

        if (!conditions.isEmpty()) {
            whereClause = ' WHERE ' + String.join(conditions, ' AND ');
        }
        if(whereClause != '' || whereClause.length() > 0) {
            query = 'SELECT Id, Account__r.name, Product_Quantity__c, Product_Name__c, Product__r.Price__c, Price__c, Discount__c, Contact__r.Name, Sales_Date__c, status__c FROM Sales__c'
                        + whereClause 
                        + ' ORDER BY Sales_Date__c DESC '
                        + 'LIMIT '+ pageSize +' OFFSET '+ offset;
            System.debug('whereClause o 쿼리 : '+query);
        } else {
            query = 'SELECT Id, Account__r.name, Product_Quantity__c, Product_Name__c, Product__r.Price__c, Price__c, Discount__c, Contact__r.Name, Sales_Date__c, status__c FROM Sales__c'
            + ' ORDER BY Sales_Date__c DESC '
            + 'LIMIT '+ pageSize +' OFFSET '+ offset;
            System.debug('whereClause x 쿼리 : '+query);
        }
        return Database.query(query);
    }
    // @AuraEnabled(cacheable=true scope='global')
    // public static List<Sales__c> getSalesByAccountId(String accountId, Integer pageNumber, Integer pageSize){
    //     Integer offset = (pageNumber - 1) * pageSize;
    //     // System.debug('accountId : ' + accountId);
    //     // System.debug('pageNumber : '+pageNumber+', pageSize : '+pageSize+', offset : '+offset);
    //     if(accountId == null || accountId == '') {
    //         return [SELECT Id, Account__r.name, Product_Quantity__c, Product_Name__c,  Product__r.Price__c, Price__c, Discount__c, Contact__r.Name, Sales_Date__c, status__c
    //                 FROM Sales__c
    //                 ORDER BY Sales_Date__c DESC
    //                 LIMIT :pageSize OFFSET :offset];
    //     } else {
    //         return [SELECT Id, Account__r.name, Product_Quantity__c, Product_Name__c, Product__r.Price__c, Price__c, Discount__c, Contact__r.Name, Sales_Date__c, status__c
    //         FROM Sales__c
    //         WHERE Account__c = :accountId
    //         ORDER BY Sales_Date__c DESC
    //         LIMIT :pageSize OFFSET :offset];
    //     }
    // }

    // 전체 판매 건수 조회
    @AuraEnabled(cacheable=true)
    public static Integer getTotalSalesCount(String accountId) {
        Integer count = 0;
        if(accountId != null) {
            count = [SELECT Count() FROM Sales__c WHERE Account__c = :accountId];
        } else {
            count = [SELECT Count() FROM Sales__c];
        }
        return count;
    }

    //노트북 조회
    @AuraEnabled(cacheable=true)
    public static List<Product2> getNotebookNames(){
        return [SELECT Id, Name FROM Product2 WHERE Product_Type__c = '노트북'];
    }
}

// 검색버전없는 메소드
// @AuraEnabled(cacheable=true scope='global')
//     public static List<Sales__c> getSalesByAccountId(String accountId, Integer pageNumber, Integer pageSize){
//         Integer offset = (pageNumber - 1) * pageSize;
//         // System.debug('accountId : ' + accountId);
//         // System.debug('pageNumber : '+pageNumber+', pageSize : '+pageSize+', offset : '+offset);
//         if(accountId == null || accountId == '') {
//             return [SELECT Id, Account__r.name, Product_Quantity__c, Product_Name__c,  Product__r.Price__c, Price__c, Discount__c, Contact__r.Name, Sales_Date__c, status__c
//                     FROM Sales__c
//                     ORDER BY Sales_Date__c DESC
//                     LIMIT :pageSize OFFSET :offset];
//         } else {
//             return [SELECT Id, Account__r.name, Product_Quantity__c, Product_Name__c, Product__r.Price__c, Price__c, Discount__c, Contact__r.Name, Sales_Date__c, status__c
//             FROM Sales__c
//             WHERE Account__c = :accountId
//             ORDER BY Sales_Date__c DESC
//             LIMIT :pageSize OFFSET :offset];
//         }
//     }


// @AuraEnabled(cacheable=true scope='global')
    // public static List<VoC__c> getVocs(String searchTerm){
    //     searchTerm = searchTerm.trim();
    //     if(searchTerm == null || searchTerm.length() == 0) {
    //         return [SELECT Id, VoC_Type__c, ContactId__r.Name, ContactId__r.Phone, VoC_Product_Name__c, VoC_Subject__c, VoC_Start_Date__c, VoC_End_Date__c, VoC_Status__c
    //                 FROM VoC__c
    //                 ORDER BY CreatedDate DESC];
    //     } else {
    //         searchTerm = '%' + searchTerm + '%';
    //         return [SELECT Id, VoC_Type__c, ContactId__r.Name, ContactId__r.Phone, VoC_Product_Name__c, VoC_Subject__c, VoC_Start_Date__c, VoC_End_Date__c, VoC_Status__c
    //                 FROM VoC__c
    //                 WHERE ContactId__r.Phone  LIKE :searchTerm 
    //                 ORDER BY CreatedDate DESC];
    //     }
        
    // }

    // 기존 판매내역 쿼리
    // @AuraEnabled(cacheable=true scope='global')
    // public static List<Sales__c> getSalesByLocation(String location){
    //     if(location != null) {
    //         return [SELECT Id, Location__c, Product_Quantity__c, Product_Name__c, Product__r.Price__c, Price__c, Discount__c, Contact__r.Name, Sales_Date__c, status__c
    //                 FROM Sales__c
    //                 WHERE Location__c LIKE :location
    //                 ORDER BY Sales_Date__c DESC];
    //     } else {
    //         return [SELECT Id, Location__c, Product_Quantity__c, Product_Name__c, Product__r.Price__c, Price__c, Discount__c, Contact__r.Name, Sales_Date__c, status__c
    //                 FROM Sales__c
    //                 ORDER BY Sales_Date__c DESC];
    //     }
    // }

    // @AuraEnabled
    // public static void updateEndDate(List<VoC__c> vocList, Map<Id, VoC__c> oldMap){

    //     for(VoC__c v : vocList){
    //         boolean isClosed = v.VoC_Status__c == 'Closed';
    //         boolean wasClosed = oldMap != null && oldMap.get(v.Id).VoC_Status__c == 'Closed';
    //         boolean changedToClosed = !wasClosed && isClosed;

    //         if(isClosed || (oldMap == null || changedToClosed)) {
    //             v.VoC_End_Date__c = Date.today();
    //         }
    //     }
    // }