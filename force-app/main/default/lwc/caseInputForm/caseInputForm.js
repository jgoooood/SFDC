import { LightningElement, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getProd from '@salesforce/apex/ProductService.getProd';
import getAccountByUser from '@salesforce/apex/AccountService.getAccountByUser';

export default class CaseInputForm extends LightningElement {
    @api recordId;
    selectedProducts = [];
    prodsOptions;
    accountId = [];
    type = '';

    @wire(getProd)
    wiredProds({ data, error }) {
        if (data) {
            this.prodsOptions = data.map(prod => {
                return { label: prod.Name, value: prod.Name };
            });
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.prodsOptions = undefined;
        }
    }

    @wire(getAccountByUser)
    wiredAccount({ data, error }) {
        if (data) {
            this.accountId = data['Id'];
            this.error = undefined;
        } else if (error) {
            this.accountId = undefined;
            this.error = error;
        }
    }

    handleCheckboxChange(event) {
        this.selectedProducts = event.detail.value;
    }

    handleSubmit(event) {
        event.preventDefault(); // Stop the form from submitting
        if (this.type === '') {
            const evt = new ShowToastEvent({
                title: '저장 실패',
                message: '상담 유형을 선택해주세요.',
                variant: 'error',
                mode: 'sticky'
            });
            this.dispatchEvent(evt);
        } else if (this.type === '구매상담' && this.selectedProducts.length === 0) {
            const evt = new ShowToastEvent({
                title: '저장 실패',
                message: '상품을 선택해주세요.',
                variant: 'error',
                mode: 'sticky'
            });
            this.dispatchEvent(evt);
        } else if (this.accountId.length === 0) {
            const evt = new ShowToastEvent({
                title: '저장 실패',
                message: '상담 판매점을 선택해주세요.',
                variant: 'error',
                mode: 'sticky'
            });
            this.dispatchEvent(evt);
        } else {
            const fields = event.detail.fields;
            if (this.type === '구매상담') {
                fields.Case_Item__c = this.selectedProducts.join(','); // Assuming Case_Item__c can store the IDs as a string
            } else {
                fields.Case_Item__c = '';
            }
            this.template.querySelector('lightning-record-edit-form').submit(fields);
        }
    }

    successSaveHandler() {
        const evt = new ShowToastEvent({
                title: '성공',
                message: '상담 정보가 입력되었습니다.',
                variant: 'success',
            });
        this.dispatchEvent(evt);
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }

    typeHandler(event) {
        this.type = event.detail.value;
    }

    accountIdHandler(event) {
        this.accountId = event.detail.value;
        console.log(this.accountId.length);
    }
}