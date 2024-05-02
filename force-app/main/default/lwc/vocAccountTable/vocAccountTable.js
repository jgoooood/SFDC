import { LightningElement, wire, api } from 'lwc';
import { subscribe, unsubscribe, MessageContext, publish } from 'lightning/messageService';
import { refreshApex } from '@salesforce/apex';
import getVocSalesByAccount from '@salesforce/apex/VocService.getVocSalesByAccount';
import getAccessBGroup from '@salesforce/apex/UserService.getAccessBGroup';
import SEARCH_TERM_CHANNEL from '@salesforce/messageChannel/SearchTermChannel__c';

export default class VocAccountTable extends LightningElement {
    accounts;
    searchTerm = '';
    accRefresh;
    isModalOpen = false;
    @api accountId;
    @api accountName;
    @api refresh(){
        refreshApex(this.accRefresh); //데이터 새로고침
    }

    cols = [
        { fieldName: 'Rank',     label: '순위' },
        { fieldName: 'Name',     label: '판매점' },
        { fieldName: 'totalPrice', label: '매출액' }, 
        // { fieldName: 'OwnerName',  label: '담당자' }, 
        // { fieldName: 'Phone',    label: '연락처' }, 
    ];

    searchTermSubscription;

    @wire(MessageContext)
    messageContext;

    @wire(getVocSalesByAccount, {searchTerm: '$searchTerm'})
    wiredAccounts(result){
        if(result.data) {
            this.accRefresh = result;
            this.error = undefined;
            let data = result.data;
            this.accounts = [];
            if(data) {
                this.accounts = data.map( (accRecord, index)=>({
                    Name: accRecord.Name,
                    totalPrice: new Intl.NumberFormat('ko-KR').format(accRecord.totalPrice) +'원',
                    Rank: index + 1
                    // OwnerName: accRecord.Owner.Name,
                    // Phone: accRecord.Phone
                }));
            }
        } else if(result.error) {
            this.accounts = undefined;
            this.error = error;
        }
    }


    // 로그인 유저 프로필 
    // @wire(getAccessBGroup)
    // wiredProfile({ error, data}) {
    //     if(data) {
    //         this.userProfile = data;
    //     } else {
    //         this.error = error;
    //     }
    // }

    //채널관련 함수
    connectedCallback() {
        this.subscribeToSearchTermMessageChannel();
        // this.subscribeToRefreshVocMessageChannel();
    }

    disconnectedCallback() {
        this.unsubscribeFromMessageChannel();
    }
    
    unsubscribeFromMessageChannel() {
        if (this.searchTermSubscription) {
            unsubscribe(this.searchTermSubscription);
            this.searchTermSubscription = null;
        }
        // if (this.refreshVocSubscription) {
        //     unsubscribe(this.refreshVocSubscription);
        //     this.refreshVocSubscription = null;
        // }
    }
    //Search Term 메시지채널 구독
    subscribeToSearchTermMessageChannel() {
        if (!this.searchTermSubscription) {
            this.searchTermSubscription = subscribe(
                this.messageContext,
                SEARCH_TERM_CHANNEL,
                (message) => this.handleSearchTermMessage(message)
            );
        }
    }

    handleSearchTermMessage(message) {
        this.searchTerm = message.searchTerm;
    }

    onRowClick(event){
        this.accountName = event.currentTarget.dataset.id;
        const selectedEvent = new CustomEvent('accountselect', {
            detail: this.accountName
        });
        this.dispatchEvent(selectedEvent);
    }

    openModal() {
        this.isModalOpen = true;
        this.type='account';
    }

    handleModalClose() {
        this.isModalOpen = false;
    }
    // // 체크박스 변경 이벤트 핸들러
    // handleCheckboxChange(event) {
    //     const selectedRow = event.target.dataset.id;
    //     const isChecked = event.target.checked;

    //     if (isChecked) {
    //         this.selectedRows.push(selectedRow);
    //     } else {
    //         this.selectedRows = this.selectedRows.filter(id => id !== selectedRow);
    //     }
    //     this.isDisabled = this.selectedRows.length === 0;
    // }
}


    // 기존 판매점 가져오는 함수
    // @wire(getVocSalesByAccount, {searchTerm: '$searchTerm'})
    // wiredAccounts(result){
    //     if(result.data) {
    //         this.accRefresh = result;
    //         this.error = undefined;
    //         let data = result.data;
    //         this.accounts = [];
    //         if(data) {
    //             this.accounts = data.map( (accRecord, index)=>({
    //                 Name: accRecord.Name,
    //                 totalPrice: new Intl.NumberFormat('ko-KR').format(accRecord.totalPrice) +'원',
    //                 Rank: index + 1
    //                 // OwnerName: accRecord.Owner.Name,
    //                 // Phone: accRecord.Phone
    //             }));
    //         }
    //     } else if(result.error) {
    //         this.accounts = undefined;
    //         this.error = error;
    //     }
    // }

    // 행 클릭함수
    // onRowClick(event){
    //     this.accountId = event.currentTarget.dataset.Id;
    //     const selectedEvent = new CustomEvent('accountselect', {
    //         detail: this.accountId
    //     });
    //     console.log('acc테이블 선택 accountName ->' + this.accountName);
    //     this.dispatchEvent(selectedEvent);
    // }