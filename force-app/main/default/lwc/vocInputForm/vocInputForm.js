import { LightningElement, api, wire } from 'lwc';
import { getFieldValue, getRecord, updateRecord  } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getProdByContactId from '@salesforce/apex/VocService.getProdByContactId';
import getContactPhone from '@salesforce/apex/VocService.getContactPhone';
import FIELD_CONTACT from '@salesforce/schema/VoC__c.ContactId__c';
import FIELD_CONTACT_PHONE from '@salesforce/schema/VoC__c.VoC_Contact_Phone__c';
import FIELD_PRODUCT from '@salesforce/schema/VoC__c.VoC_Product_Name__c';
import FIELD_TYPE from '@salesforce/schema/VoC__c.VoC_Type__c';
import FIELD_STATUS from '@salesforce/schema/VoC__c.VoC_Status__c';
import FIELD_SUBJECT from '@salesforce/schema/VoC__c.VoC_Subject__c';
import FIELD_DESCRIPTION from '@salesforce/schema/VoC__c.VoC_Description__c';
import FIELD_START_DATE from '@salesforce/schema/VoC__c.VoC_Start_Date__c';

const fields = [FIELD_CONTACT, FIELD_CONTACT_PHONE, FIELD_PRODUCT, FIELD_TYPE, FIELD_STATUS, FIELD_SUBJECT, FIELD_DESCRIPTION, FIELD_START_DATE];


export default class VocInputForm extends LightningElement {
    
    selectedContactId;
    selectedProdName;
    productNames = [];
    contactPhone;
    vocType;
    vocStatus;
    vocSubject;
    vocDescription;
    vocStartDate;

    @api recordId;

    @wire(getRecord, { recordId: '$recordId', fields:fields })
    vocRecord({ error, data}) {
        if(data) {
            this.selectedContactId = getFieldValue(data, FIELD_CONTACT);
            this.contactPhone = getFieldValue(data, FIELD_CONTACT_PHONE);
            this.selectedProdName = getFieldValue(data, FIELD_PRODUCT);
            this.vocType = getFieldValue(data, FIELD_TYPE);
            this.vocType = getFieldValue(data, FIELD_TYPE);
            this.vocStatus = getFieldValue(data, FIELD_STATUS);
            this.vocSubject = getFieldValue(data, FIELD_SUBJECT);
            this.vocDescription = getFieldValue(data, FIELD_DESCRIPTION);
            this.vocStartDate = getFieldValue(data, FIELD_START_DATE);
        } else if(error){
            console.log(error);
        }
    }

    @wire(getProdByContactId, { ContactId: '$selectedContactId'})
    wiredProdCodes({error, data}) {
        if(data) {
            //console.log(data);
            this.productNames = [...data.map(prodName => ({
                label: prodName.Product_Name__c,
                value: prodName.Product_Name__c
            }))];
        } else {
            this.productNames = [];
            this.error = error;
            console.error(error);
        }
    }

    @wire(getContactPhone, { ContactId: '$selectedContactId' })
    wiredContactPhone({error, data}) {
        if(data) {
            // console.log(data);
            this.contactPhone = data[0].Phone;
            // console.log(this.contactPhone);
        } else if(error) {
            this.error = error;
            console.log(error);
        }
    }
    

    contactChangeHandler(event) {
        this.selectedContactId = event.target.value;
        //console.log('선택id : ' + this.selectedContactId);
    }

    prodChangeHandler(event) {
        this.selectedProdName = event.detail.value;
        //console.log(this.selectedProdCode);
    }

    successSaveHandler() {
        // console.log('success핸들러 호출시작');
        let message = this.recordId ? 'VoC 수정이 완료되었습니다' : 'VoC 등록이 완료되었습니다';
        this.dispatchEvent(new CustomEvent('savesuccess', {
            detail: { message: message },
            bubbles: true,
            composed: true
        }));
        
        // 'viewdetail' 이벤트 발생시키고 recordId 전달
        if (this.recordId) {
            this.dispatchEvent(new CustomEvent('viewdetail', {
                detail: { recordId: this.recordId },
                bubbles: true, 
                composed: true
            }));
        }
        this.dispatchEvent(new CustomEvent('publish', {publish: true}));
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
        
    }
    // 

    handleError(error) {
        console.error('폼 제출 오류:', error);
    }

    submitHandler(event){
        event.preventDefault();
        const fields = event.detail.fields; // 기존 필드 데이터 가져오기
        fields.ContactId__c = this.selectedContactId;
        fields.VoC_Product_Name__c = this.selectedProdName; //콤보박스에서 선택된 값 넣어줌(자동으로 폼제출x)
        fields.VoC_Contact_Phone__c = this.contactPhone; 
        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }
}

	// @wire(getObjectInfo, { objectApiName: OBJECT_CASE })
    // objectInfo;

    // @api submitForm() {
    //     this.template.querySelector('lightning-record-edit-form').submit();
    //     console.log('2_inputForm.js->submit() 완료');
    // }


// handleSuccess(){
    //     //모달창 저장 성공 이벤트발생
    //     this.dispatchEvent(new CustomEvent('savesuccess', { bubbles: true, composed: true }));
    //     console.log('savesuccess 이벤트 생성완료');
    // }

    // submitHandler(event){
    //     if (this.addRequired && !this.selectedContactId) {
    //         event.preventDefault(); 
    //         this.dispatchEvent(
    //             new ShowToastEvent({
    //                 title: 'Error',
    //                 message: '구매상담을 선택한 경우 구매고객을 입력해주세요.',
    //                 variant: 'error',
    //             }),
    //         );
    //         return;
    //     }

    //     if (this.addRequired && !this.selectedProdId) {
    //         event.preventDefault(); 
    //         this.dispatchEvent(
    //             new ShowToastEvent({
    //                 title: 'Error',
    //                 message: '구매상담을 선택한 경우 구매제품을 입력해주세요.',
    //                 variant: 'error',
    //             }),
    //         );
    //         return;
    //     }
    // }

    

    
    	// @wire(getRecord, { recordId: '$recordId', fields:fieldsToLoad })
    // wiredTripReport({ error, data }) {
    //     if (data) {
	// 		this.type = getFieldValue(data, FIELD_TYPE);
	// 		this.status = getFieldValue(data, FIELD_STATUS);
	// 		this.contact = getFieldValue(data, FIELD_CONTACT);
    //         this.product = getFieldValue(data, FIELD_PRODUCT);
    //         this.error = undefined;
    //     } else if (error) {
    //         this.error = error;
            
    //     }
    // }


//기존 success핸들러
    //successSaveHandler() {
        //     // console.log('success핸들러 호출시작');
        //     let message = this.recordId ? 'VoC 수정이 완료되었습니다' : 'VoC 등록이 완료되었습니다';
        //     const evt = new ShowToastEvent({
        //         title: '성공',
        //         message: message,
        //         variant: 'success'
        //     });
            
        //     console.log('success핸들러 토스트');
        //     // 'viewdetail' 이벤트 발생시키고 recordId 전달
        //     if (this.recordId) {
        //         this.dispatchEvent(new CustomEvent('viewdetail', {
        //             detail: { recordId: this.recordId },
        //             bubbles: true, 
        //             composed: true
        //         }));
        //     }
        //     this.dispatchEvent(new CustomEvent('publish', {publish: true}));
        //     this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
            
        // }