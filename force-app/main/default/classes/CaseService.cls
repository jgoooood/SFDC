public with sharing class CaseService {

    @AuraEnabled(cacheable=true)
    public static List<Case> getCasesById(Id contactId) {
        User loginUser = [SELECT Location__c FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
        if (loginUser.Location__c == null) {
            return [SELECT Type, Contact.Name, Case_Item__c, Account.Id, Subject, CreatedDate FROM Case WHERE Contact.Id = :contactId AND Type = '구매상담' AND isSales__c = false];
        } else {
            return [SELECT Type, Contact.Name, Case_Item__c, Account.Id, Subject, CreatedDate FROM Case WHERE Account.Location__c = :loginUser.Location__c AND Contact.Id = :contactId AND Type = '구매상담' AND isSales__c = false];
        }
        
    }

    @AuraEnabled(cacheable=true)
    public static List<Case> getCases(Integer pageNumber, Integer pageSize) {
        Integer offset = (pageNumber - 1) * pageSize;
        return [SELECT Type, Contact.Name, Case_Item__c, Subject, CreatedDate
                FROM Case
                ORDER BY CreatedDate DESC
                LIMIT :pageSize OFFSET :offset];
    }
    // @AuraEnabled(cacheable=true)
    // public static List<Case> getCases() {
    //     return [SELECT Type, Contact.Name, Case_Item__c, Subject, CreatedDate FROM Case];
    // }

    // public static void updateField(List<Sales__c> sales) {
    //     String prodName = '';
    //     for (Sales__c sale : sales) {
    //         prodName += sale.Product_Name__c + ',';
    //     }

    //     [SELECT Id FROM Case WHERE ContactId = ]
    // }


    public static void vaildateCase(List<Case> cases) {
        User loginUser = [SELECT Location__c FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];

        
            for(Case c : cases){
                Account acct = [SELECT Location__c FROM Account WHERE Id = :c.AccountId LIMIT 1];
                
                if (loginUser.Location__c != null) {
                    if (acct.Location__c != loginUser.Location__c) {
                        c.AccountId.addError('자신의 판매점의 상담 내역만 입력할 수 있습니다.');
                    }
                }
    
                if(c.Type == '구매상담') {
                    if(c.ContactId == null){
                        c.ContactId.addError('구매고객을 입력해주세요.');
                    }
                } 
        }
    }

    public static void updateField(List<Sales__c> sales) {
        String prodName = '';
        Id con = sales[0].Contact__c;
        Id acct = sales[0].Account__c;

        for (Integer i=0; i < sales.size(); i++) {
            Sales__c sale = sales[i];
            prodName += sale.Product_Name__c;

            if (i != sales.size() - 1) {
                prodName += ',';
            }
        }
        System.debug(prodName);
        Case c = [SELECT Id FROM Case WHERE ContactId = :con AND AccountId = :acct AND Case_Item__c = :prodName AND isSales__c = false LIMIT 1];

        c.isSales__c = true;
        update c;
    }

    @AuraEnabled
    public static void updateCaseCount(List<Case> newCases){
        Set<Id> contactIds = new Set<Id>();

        for(Case c : newCases) {
            if(c.ContactId != null) {
                contactIds.add(c.ContactId);
            }
        }

        List<Contact> cons = [SELECT Id, Case_Count__c FROM Contact WHERE Id IN :contactIds];

        List<AggregateResult> caseResult = [SELECT ContactId, COUNT(Id) cnt
                                            FROM Case
                                            WHERE ContactId IN :contactIds
                                            GROUP BY ContactId];

        List<Contact> updateContact = new List<Contact>();
        for(AggregateResult result : caseResult){
            Id contactId = (Id) result.get('ContactId');

            for (Contact con : cons) {
                if (con.Id == contactId) {
                    con.Case_Count__c = (Integer) result.get('cnt');
                    updateContact.add(con);
                }
            }
        }
        System.debug('success');
        update updateContact;
    }

    @AuraEnabled
    public static void deleteCaseById(Id caseId) {
        System.debug(caseId);
        Case cases = [SELECT Id FROM Case WHERE Id = :caseId LIMIT 1];
        System.debug(cases);
        delete cases;
    }

    @AuraEnabled(cacheable=true)
    public static Integer getTotalCaseCount(){
        return [SELECT COUNT() FROM Case];
    }
}