import deleteCaseById from '@salesforce/apex/CaseService.deleteCaseById';
import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAccessCGroup from '@salesforce/apex/UserService.getAccessCGroup';

export default class CaseDetail extends LightningElement {
    @api caseId;
    viewMode = true;
    updateMode = false;
    userProfile;

    changeUpdateModeHandler() {
        this.viewMode = false;
        this.updateMode = true;
    }

    successUpdateHandler() {
        const evt = new ShowToastEvent({
            title: '수정 성공',
            message: '상담 정보가 수정되었습니다.',
            variant: 'success'
        });
        this.dispatchEvent(evt);
        console.log(999);
        this.dispatchEvent(new CustomEvent('refresh'));
        this.viewMode = true;
        this.updateMode = false;
    }
    cancelHandler() {
        this.viewMode = true;
        this.updateMode = false;
    }

    deleteHandler() {
        if(confirm("정말 삭제하시겠습니까?")){
            console.log(this.caseId);
            deleteCaseById({ caseId: this.caseId })
            .then((result) => {
                const evt = new ShowToastEvent({
                    title: '삭제 완료',
                    message: '상담 정보가 삭제되었습니다.',
                    variant: 'success'
                });
                this.dispatchEvent(evt);
            });
        }
    }

    @wire(getAccessCGroup)
    wiredProfile({ error, data}) {
        if(data) {
            this.userProfile = data;
        } else {
            this.error = error;
        }
    }
}