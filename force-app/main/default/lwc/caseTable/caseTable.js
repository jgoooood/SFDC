import { LightningElement, api, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getCases from '@salesforce/apex/CaseService.getCases';
import getAccessCGroup from '@salesforce/apex/UserService.getAccessCGroup';
import getTotalCaseCount from '@salesforce/apex/CaseService.getTotalCaseCount' 

export default class CaseTable extends LightningElement {
    @api contactId;
    @api productId;
    @api caseId;
    caseList;
    isModalOpen = false;
    type = '';
    caseListResult;
    error;
    userProfile;

    currentPage = 1;
    totalPages; // 전체 페이지 수
    pageSize = 10; // 페이지 표시할 항목 수

    get showButton() {
        return this.userProfile === 'System Administrator' || this.userProfile === 'C Group';
    }

    @wire(getCases, { pageNumber: '$currentPage', pageSize: '$pageSize' })
    wiredCases(result) {
        if (result.data) {
            this.caseListResult = result;
            this.error = undefined;
            
            const data = result.data;
            console.log(result.data);
            this.caseList = data.map ( (caseRecord) => ({ 
                Id: caseRecord.Id,
                Type: caseRecord.Type,
                ProductName: caseRecord.Case_Item__c,
                Contact: caseRecord.Contact,
                Subject: caseRecord.Subject,
                Status: caseRecord.Status,
                CreatedDate: new Intl.DateTimeFormat('ko-KR', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' }).format(new Date(caseRecord.CreatedDate))
            }));
        } else if (result.error) {
            this.caseList = undefined;
            this.error = error;
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

    @wire(getTotalCaseCount)
    wiredTotalCount({ error, data }) {
        // console.log(data);
        if (data) {
            this.totalRecords = data;
            this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        } else if (error) {
            this.error = result.error;
            console.log(this.error);
        }
    }

    openModal() {
        this.isModalOpen = true;
        this.type = 'case';
    }

    handleModalClose() {
        this.isModalOpen = false;
        refreshApex(this.caseListResult);
    }

    btnClickHandler(event) {
        this.type = 'sales';
        this.productId = event.currentTarget.dataset.id;
        this.isModalOpen = true;
    }

    caseDetailHandler(event) {
        this.caseId = event.currentTarget.dataset.id;
        const evt = new CustomEvent('selectedcase', {
            detail: { caseId: this.caseId }
        });
        this.dispatchEvent(evt);
    }

    refreshTable() {
        console.log(111);
        refreshApex(this.caseListResult);
    }

    handleNavigation(event) {
        this.currentPage = event.detail.page;
    }
}

// @wire(getCases)
//     wiredCases(result) {
//         if (result.data) {
//             this.caseListResult = result;
//             this.error = undefined;
            
//             const data = result.data;
//             console.log(result.data);
//             this.caseList = data.map ( (caseRecord) => ({ 
//                 Id: caseRecord.Id,
//                 Type: caseRecord.Type,
//                 ProductName: caseRecord.Case_Item__c,
//                 Contact: caseRecord.Contact,
//                 Subject: caseRecord.Subject,
//                 Status: caseRecord.Status,
//                 CreatedDate: new Intl.DateTimeFormat('ko-KR', { 
//                     year: 'numeric', 
//                     month: '2-digit', 
//                     day: '2-digit', 
//                     hour: '2-digit', 
//                     minute: '2-digit' }).format(new Date(caseRecord.CreatedDate))
//             }));
//         } else if (result.error) {
//             this.caseList = undefined;
//             this.error = error;
//         }
//     }