trigger UserTrigger on User (before insert, before update) {
    switch on Trigger.operationType {
        when BEFORE_INSERT {
            UserService.checkLocation(Trigger.new);
        } 
        when BEFORE_UPDATE {
            UserService.checkLocation(Trigger.oldMap, Trigger.new);
        }
    }
}