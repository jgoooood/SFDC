trigger CaseTrigger on Case (before insert, before update, after insert, after update, after delete) {
    switch on Trigger.operationType {
        when BEFORE_INSERT, BEFORE_UPDATE {
            CaseService.vaildateCase(Trigger.new);
        }
        when AFTER_INSERT, AFTER_UPDATE {
            CaseService.updateCaseCount(Trigger.new);
        } 
        when AFTER_DELETE {
            CaseService.updateCaseCount(Trigger.old);
        }
    }
    
}