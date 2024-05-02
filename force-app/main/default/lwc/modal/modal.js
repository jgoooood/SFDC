import { LightningElement, api } from 'lwc';

export default class Modal extends LightningElement {
    @api contactId;
    @api accountId;
    @api showModal = false;
    @api myCase;
    @api voc;
    @api sale;
    @api contact;
    @api account;
    @api products;
    
    closeModal() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    get modalClass() {
        return this.showModal ? 'slds-modal slds-fade-in-open' : 'slds-modal';
    }

    get backdropClass() {
        return this.showModal ? 'slds-backdrop slds-backdrop_open' : 'slds-backdrop';
    }

    // handleSubmit() {
    //     this.template.querySelector('c-voc-input-form').submitForm();
    //     console.log('1_modal.js->handleSubmit호출완료');
    // }

    // successSaveHandler() {
    //     console.log('3_modal.js->successSaveHandler호출시작');
    //     this.showModal = false;
    //     this.dispatchEvent(new ShowToastEvent({
    //         title: '성공',
    //         message: 'VoC가 등록되었습니다.',
    //         variant: 'success'
    //     }));
    //     this.dispatchEvent(new CustomEvent('close'));
    // }
}