public with sharing class UserService {
    @AuraEnabled(cacheable=true)
    public static Boolean getAccessCGroup() {
        User loginUser = [SELECT Profile.Name FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
        if (loginUser.Profile.Name == 'C Group' || loginUser.Profile.Name == 'System Administrator') {
            return true;
        } 
        return false;
    }

    @AuraEnabled(cacheable=true)
    public static Boolean getAccessBGroup() {
        User loginUser = [SELECT Profile.Name FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
        if (loginUser.Profile.Name == 'B Group' || loginUser.Profile.Name == 'System Administrator') {
            return true;
        } 
        return false;
    }

    public static void checkLocation(List<User> users) {
        for (User user : users) {
            if (user.Location__c != null) {
                Integer cnt = [SELECT COUNT() FROM User WHERE Location__c = :user.Location__c];

                if (cnt >= 1) {
                    user.Location__c.addError('해당 지점에는 판매 담당자가 존재합니다.');
                }
            }
        }
    }

    public static void checkLocation(Map<Id, User> usersOld, List<User> users) {
        for (User user : users) {
            if (usersOld.get(user.Id).Location__c != user.Location__c) {
                if (user.Location__c != null) {
                    Integer cnt = [SELECT COUNT() FROM User WHERE Location__c = :user.Location__c];
    
                    if (cnt >= 1) {
                        user.Location__c.addError('해당 지점에는 판매 담당자가 존재합니다.');
                    }
                }
            }
        }
    }
}