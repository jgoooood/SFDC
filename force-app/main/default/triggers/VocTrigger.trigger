trigger VocTrigger on VoC__c (before insert, before update, after insert, after update, after delete) {
    switch on Trigger.operationType {
        when BEFORE_INSERT {
            VocService.updateEndDate(Trigger.new, null);
        }
        when BEFORE_UPDATE {
            VocService.updateEndDate(Trigger.new, Trigger.oldMap);
        }
        when AFTER_INSERT {
            VocService.updateVocCount(Trigger.new);
            VocService.mailToContact(Trigger.new, null);
        } 
        when AFTER_UPDATE {
            VocService.updateVocCount(Trigger.new);
            VocService.mailToContact(Trigger.new, Trigger.oldMap);
        } 
        when AFTER_DELETE {
            VocService.updateVocCount(Trigger.old);
        }
    }
}