import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { subscribe, unsubscribe, MessageContext, publish } from 'lightning/messageService';
import REFRESH_VOC_CHANNEL from '@salesforce/messageChannel/RefreshVocChannel__c';
import VOC_RECORD_SELECTED_CHANNEL from '@salesforce/messageChannel/SelectedVocChannel__c';
import getUserProfile from '@salesforce/apex/VocService.getUserProfile';
import deleteVocs from '@salesforce/apex/VocService.deleteVocs';

export default class VocDetail extends LightningElement {

    userProfile;
    modifyMode = false;
    viewMode = true;
    //채널관련 변수
    subscription = null;
    refreshVocSubscription;

    @api recordId;

    @wire(MessageContext)
    messageContext;

    // 로그인 유저 프로필 
    @wire(getUserProfile)
    wiredProfile({ error, data}) {
        if(data) {
            this.userProfile = data;
        } else {
            this.error = error;
        }
    }

    get showButton() {
        return this.userProfile === 'System Administrator' || this.userProfile === 'B Group';
    }

    // 메시지채널 관련 함수
    connectedCallback() {
        this.subscribeToMessageChannel();
        this.subscribeToRefreshVocMessageChannel();
    }

    disconnectedCallback() {
        this.unsubscribeFromMessageChannel();
    }

    //레코드 다중 선택 채널 구독
    subscribeToMessageChannel() {
        this.subscription = subscribe(
            this.messageContext, 
            VOC_RECORD_SELECTED_CHANNEL, 
            (message) => this.handleMessage(message)
        );
    }
    
    //테이블 새로고침 채널 구독
    subscribeToRefreshVocMessageChannel() {
        if (!this.refreshVocSubscription) {
            this.refreshVocSubscription = subscribe(
                this.messageContext,
                REFRESH_VOC_CHANNEL,
                () => this.resetDetail()
            );
        }
    }

    //구독취소
    unsubscribeFromMessageChannel() {
        if (this.subscription) {
            unsubscribe(this.subscription);
            this.subscription = null;
        }
        if (this.refreshVocSubscription) {
            unsubscribe(this.refreshVocSubscription);
            this.refreshVocSubscription = null;
        }
    }

    // 수정버튼
    modifyDetail(){
        this.modifyMode = true;
        this.viewMode = false;
    }

    // 삭제버튼
    deleteVoc(){
        if(this.recordId) {
            deleteVocs({ vocIds: this.recordId })
                .then(() => {
                    const evt = new ShowToastEvent({
                        title: '삭제완료',
                        message: 'VoC 삭제가 완료되었습니다.',
                        variant: 'success'
                    });
                    this.dispatchEvent(evt);
                    this.resetDetail();
                    this.publishHandler();
                })
                .catch(error => {
                    console.error('delete에러: '+ error);
                });
        }
    }

    publishHandler() {
        publish(this.messageContext, REFRESH_VOC_CHANNEL, {});
    }

    //토스트이벤트
    handleSaveSuccess(event) {
        // const message = event.detail.message;
        // this.dispatchEvent(new ShowToastEvent({
        //     title: '성공',
        //     message: message,
        //     variant: 'success'
        // }));

        this.resetDetail();
        this.publishHandler();
    }

    handleMessage(message) {
        this.recordId = message.recordId;
    }

    viewHandler(event){
        this.modifyMode = false;
        this.viewMode = true;
        this.recordId = event.detail.recordId;   
    }

    resetDetail(){
        this.recordId = null;
        this.modifyMode = false;
        this.viewMode = true;
    }
}