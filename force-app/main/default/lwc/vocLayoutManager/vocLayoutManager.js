import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { publish, MessageContext } from 'lightning/messageService';
import REFRESH_VOC_CHANNEL from '@salesforce/messageChannel/RefreshVocChannel__c';

export default class vocLayoutManager extends LightningElement {

    @wire(MessageContext)
    messageContext;

    connectedCallback() {
        this.template.addEventListener('savesuccess', this.handleSaveSuccess.bind(this));
    }

    handleSaveSuccess(event) {
        const message = event.detail.message;
        this.dispatchEvent(new ShowToastEvent({
            title: '성공',
            message: message,
            variant: 'success'
        }));
        publish(this.messageContext, REFRESH_VOC_CHANNEL, {});

    }
}