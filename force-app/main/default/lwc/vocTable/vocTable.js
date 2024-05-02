import { LightningElement, wire, api, track } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { subscribe, unsubscribe, MessageContext, publish } from 'lightning/messageService';
import SEARCH_TERM_CHANNEL from '@salesforce/messageChannel/SearchTermChannel__c';
import REFRESH_VOC_CHANNEL from '@salesforce/messageChannel/RefreshVocChannel__c';
import getVocs from '@salesforce/apex/VocService.getVocs';
import getTotalVocCount from '@salesforce/apex/VocService.getTotalVocCount';
import getAccessBGroup from '@salesforce/apex/UserService.getAccessBGroup';
import deleteVocs from '@salesforce/apex/VocService.deleteVocs';
import VOC_RECORD_SELECTED_CHANNEL from '@salesforce/messageChannel/SelectedVocChannel__c';

export default class VocTable extends LightningElement {
    
    @api accountId;
    @track currentPage = 1;

    totalPages; // 전체 페이지 수
    pageSize = 10; // 페이지 표시할 항목 수

    VoC;
    type;
    userProfile;
    searchTerm = '';
    selectedRows = [];
    isModalOpen = false;
    isDisabled = true;
    error;
    //채널관련변수
    searchTermSubscription;
    refreshVocSubscription;
    
    cols = [
        { fieldName: 'VoC_Type__c',          label: '유형' },
        { fieldName: 'ContactId',            label: '고객' }, 
        { fieldName: 'VoC_Contact_Phone__c', label: '고객연락처' }, 
        { fieldName: 'VoC_Product_Name__c',  label: '제품' }, 
        { fieldName: 'VoC_Subject__c',       label: '제목' },
        { fieldName: 'VoC_Status__c',        label: '상태' },
        { fieldName: 'VoC_Start_Date__c',    label: '작성일' }
    ];

    // 프로필별 등록, 삭제 버튼 노출여부체크
    get showButton() {
        return this.userProfile === 'System Administrator' || this.userProfile === 'B Group';
    }

    @wire(MessageContext)
    messageContext;

    //voc 내역 조회
	@wire(getVocs, {searchTerm: '$searchTerm', pageNumber: '$currentPage', pageSize: '$pageSize'})
    wiredVocs(result) {
        if (result.data) {
            this.vocRefresh = result;
            this.error = undefined;
            let data = result.data;
            this.VoC = [];
            if (data) {
                this.VoC = data.map ( (vocRecord) => ({ 
                    Id: vocRecord.Id,
                    VoC_Type__c: vocRecord.VoC_Type__c,
                    ContactId: vocRecord.ContactId__r.Name,
                    VoC_Contact_Phone__c: vocRecord.ContactId__r.Phone,
                    VoC_Product_Name__c: vocRecord.VoC_Product_Name__c,
                    VoC_Subject__c: vocRecord.VoC_Subject__c,
                    VoC_Status__c: vocRecord.VoC_Status__c, 
                    VoC_Start_Date__c: new Intl.DateTimeFormat('ko-KR', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                    }).format(new Date(vocRecord.VoC_Start_Date__c)),
                    // VoC_Start_Date__c: new Intl.DateTimeFormat('ko-KR', {
                    //     dateStyle: 'short',
                    //     timeStyle: 'short'
                    // }).format(new Date(vocRecord.VoC_Start_Date__c)),
                    // detailPageUrl: `/lightning/r/VoC__c/${vocRecord.Id}/view`
                }));
            } 
        } else if (result.error) {
            this.VoC = undefined;
            this.error = result.error;
        }
    }

    //voc 건수 조회
    @wire(getTotalVocCount, { searchTerm: '$searchTerm'})
    wiredTotalCount({ error, data }) {
        if (data) {
            this.totalRecords = data;
            this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        } else if (error) {
            this.error = error;
        }
    }

    // 로그인 유저 프로필 
    @wire(getAccessBGroup)
    wiredProfile({ error, data}) {
        if(data) {
            this.userProfile = data;
        } else {
            this.error = error;
        }
    }

    // 페이징 핸들러
    handleNavigation(event) {
        this.currentPage = event.detail.page;
    }



    openModal() {
        // alert('오픈');
        this.isModalOpen = true;
        this.type='voc';
        // console.log('모달오픈 : ' + this.type);
    }

    handleModalClose() {
        this.isModalOpen = false;
        // refreshApex(this.vocRefresh);
    }

    onRowClick(event){
        const recordId = event.currentTarget.dataset.id;
        // console.log(`Selected Record ID: ${recordId}`);
        publish(this.messageContext, VOC_RECORD_SELECTED_CHANNEL, { recordId });
    }

    // 체크박스 변경 이벤트 핸들러
    handleCheckboxChange(event) {
        const selectedRow = event.target.dataset.id;
        const isChecked = event.target.checked;

        if (isChecked) {
            this.selectedRows.push(selectedRow);
        } else {
            this.selectedRows = this.selectedRows.filter(id => id !== selectedRow);
        }
        this.isDisabled = this.selectedRows.length === 0;
    }

    // 삭제 버튼 클릭 이벤트 핸들러
    deleteSelected() {
        if (this.selectedRows.length > 0) {
            deleteVocs({ vocIds: this.selectedRows })
                .then(() => {
                    const evt = new ShowToastEvent({
                        title: '삭제완료',
                        message: 'VoC 삭제가 완료되었습니다.',
                        variant: 'success'
                    });
                    this.dispatchEvent(evt);
                    this.selectedRows = []; // 삭제 후 선택된 ID 배열 초기화
                    this.isDisabled = true;
                    this.publishRefreshMessage();
                    return refreshApex(this.vocRefresh);
                })
                .catch(error => {
                    console.error('Error deleting selected VoCs:', error);
                });
        }
    }

    //채널관련 함수
    connectedCallback() {
        this.subscribeToSearchTermMessageChannel();
        this.subscribeToRefreshVocMessageChannel();
    }

    disconnectedCallback() {
        this.unsubscribeFromMessageChannel();
    }
    
    unsubscribeFromMessageChannel() {
        if (this.searchTermSubscription) {
            unsubscribe(this.searchTermSubscription);
            this.searchTermSubscription = null;
        }
        if (this.refreshVocSubscription) {
            unsubscribe(this.refreshVocSubscription);
            this.refreshVocSubscription = null;
        }
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

    //Refresh Voc 메시지채널 구독
    subscribeToRefreshVocMessageChannel() {
        if (!this.refreshVocSubscription) {
            this.refreshVocSubscription = subscribe(
                this.messageContext,
                REFRESH_VOC_CHANNEL,
                (message) => this.handleRefreshVocMessage(message)
            );
        }
    }

    //Refresh Voc Channel 발행
    publishRefreshMessage() {
        publish(this.messageContext, REFRESH_VOC_CHANNEL, {});
    }

    handleSearchTermMessage(message) {
        this.searchTerm = message.searchTerm;
    }

    handleRefreshVocMessage(message) {
        this.isDisabled = true;
        refreshApex(this.vocRefresh);
    }
}


// @wire(getVocs, {searchTerm: '$searchTerm'})
//     wiredVocs(result) {
//         if (result.data) {
//             this.vocRefresh = result;
//             this.error = undefined;
//             let data = result.data;
//             this.VoC = [];
//             if (data) {
//                 this.VoC = data.map ( (vocRecord) => ({ 
//                     Id: vocRecord.Id,
//                     VoC_Type__c: vocRecord.VoC_Type__c,
//                     ContactId: vocRecord.ContactId__r.Name,
//                     VoC_Contact_Phone__c: vocRecord.ContactId__r.Phone,
//                     VoC_Product_Name__c: vocRecord.VoC_Product_Name__c,
//                     VoC_Subject__c: vocRecord.VoC_Subject__c,
//                     VoC_Status__c: vocRecord.VoC_Status__c, 
//                     VoC_Start_Date__c: new Intl.DateTimeFormat('en-US', {
//                         dateStyle: 'short',
//                         timeStyle: 'short'
//                     }).format(new Date(vocRecord.VoC_Start_Date__c)),
//                     // VoC_Start_Date__c: new Intl.DateTimeFormat('ko-KR', {
//                     //     dateStyle: 'short',
//                     //     timeStyle: 'short'
//                     // }).format(new Date(vocRecord.VoC_Start_Date__c)),
//                     // detailPageUrl: `/lightning/r/VoC__c/${vocRecord.Id}/view`
//                 }));
//             } 
//         } else if (result.error) {
//             this.VoC = undefined;
//             this.error = result.error;
//         }
//     }

	// @wire(getAllVoc)
    // wiredVocs(result) {
    //     if (result.data) {
    //         this.vocRefresh = result;
    //         this.error = undefined;
    //         let data = result.data;
    //         this.VoC = [];
    //         if (data) {
    //             this.VoC = data.map ( (vocRecord) => ({ 
    //                 Id: vocRecord.Id,
    //                 VoC_Type__c: vocRecord.VoC_Type__c,
    //                 ContactId: vocRecord.ContactId__r.Name,
    //                 VoC_Contact_Phone__c: vocRecord.ContactId__r.Phone,
    //                 VoC_Product_Name__c: vocRecord.VoC_Product_Name__c,
    //                 VoC_Subject__c: vocRecord.VoC_Subject__c,
    //                 VoC_Status__c: vocRecord.VoC_Status__c, 
    //                 VoC_Start_Date__c: new Intl.DateTimeFormat('en-US', {
    //                     dateStyle: 'short',
    //                     timeStyle: 'short'
    //                 }).format(new Date(vocRecord.VoC_Start_Date__c)),
    //                 // detailPageUrl: `/lightning/r/VoC__c/${vocRecord.Id}/view`
    //             }));
    //         } 
    //     } else if (result.error) {
    //         this.VoC = undefined;
    //         this.error = error;
    //     }
    // }