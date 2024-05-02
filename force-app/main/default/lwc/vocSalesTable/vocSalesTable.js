import { LightningElement, wire, api, track } from 'lwc';
// import getLocationById from '@salesforce/apex/AccountService.getLocationById';
import { refreshApex } from '@salesforce/apex';
import getNotebookNames from '@salesforce/apex/VocService.getNotebookNames';
import getAccountByName from '@salesforce/apex/VocService.getAccountByName';
import getSalesByAccountId from '@salesforce/apex/VocService.getSalesByAccountId';
import getTotalSalesCount from '@salesforce/apex/VocService.getTotalSalesCount';

export default class VocSalesTable extends LightningElement {

    @track currentPage = 1;
    @track searchProd = ''; //검색_제품
    @track startDate = ''; //검색_판매시작일
    @track endDate = ''; //검색_판매종료일

    @api accountId='';
    @api accountName;
    @api refresh(){
        refreshApex(this.saleRefresh); //데이터 새로고침
    }

    totalPages; // 전체 페이지 수
    pageSize = 10; // 페이지 표시할 항목 수
    saleRefresh;
    location;
    sales;
    notebookOptions = [];

    cols = [
        { fieldName: 'Account',             label: '판매점' },
        { fieldName: 'status__c',           label: '상태' },
        { fieldName: 'Sales_Date__c',       label: '날짜' },
        { fieldName: 'Contact',             label: '고객' },
        { fieldName: 'Product_Name__c',     label: '제품' }, 
        { fieldName: 'ProductPrice',        label: '단가' }, 
        { fieldName: 'Product_Quantity__c', label: '수량' }, 
        { fieldName: 'Price__c',            label: '판매액' },
        { fieldName: 'Discount__c',         label: '할인율' },
        // { fieldName: 'VoC_Status__c',        label: '할인액' },
        // { fieldName: 'VoC_Start_Date__c',    label: '순매출액' }
    ];

    get noData() {
        return !this.sales || this.sales.length === 0;
    }

    @wire(getAccountByName, { accountName: '$accountName' })
    wiredAccountId({ data, error }) {
        this.wiredAccountResult = { data, error }; 
        if (data) {
            this.error = undefined;
            if(data.length > 0) {
                this.accountId = data[0].Id; 
            } else {
                this.accountId = null; 
            }
        } else if(error) {
            this.accountId = null;
            this.error = error; 
        }
    }


    // sales by accountId
    @wire(getSalesByAccountId, { 
        accountId: '$accountId', //판매점 id
        searchProd: '$searchProd', //선택제품
        startDate: '$startDate', //판매시작일
        endDate: '$endDate', //판매종료일
        pageNumber: '$currentPage', 
        pageSize: '$pageSize'
    })
    wiredSales({ data, error }){
        // console.log('wiredSales accountId: ' + this.accountId);
        this.saleRefresh = { data, error };
        if(data) {
            this.error = undefined;
            this.sales = [];
            if(data.length > 0) {
                this.sales = data.map( (saleRecord)=>({
                    Id: saleRecord.Id,
                    Account: saleRecord.Account__r.Name,
                    status__c: saleRecord.status__c,
                    // Sales_Date__c: saleRecord.Sales_Date__c,
                    Sales_Date__c: new Intl.DateTimeFormat('ko-KR', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                    }).format(new Date(saleRecord.Sales_Date__c)),
                    Contact: saleRecord.Contact__r.Name,
                    Product_Name__c: saleRecord.Product_Name__c,
                    ProductPrice: new Intl.NumberFormat('ko-KR').format(saleRecord.Product__r.Price__c) +'원',
                    Product_Quantity__c: saleRecord.Product_Quantity__c,
                    Price__c: new Intl.NumberFormat('ko-KR').format(saleRecord.Price__c) +'원',
                    Discount__c: saleRecord.Discount__c == null ? '-' : saleRecord.Discount__c+'%',
                    // OwnerName: accRecord.Owner.Name,
                    // Phone: accRecord.Phone
                }));
            }
        } else if(error) {
            this.sales = undefined;
            this.error = error;
            console.log(this.error);
        }
    }

    @wire(getTotalSalesCount, { accountId: '$accountId'})
    wiredTotalCount({ error, data }) {
        if (data) {
            this.totalRecords = data;
            this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        } else if (error) {
            this.error = result.error;
            console.log(this.error);
        }
    }

    
    // 노트북 picklist
    @wire(getNotebookNames)
    wiredNotebookNames({ error, data }) {
        if (data) {
            this.notebookOptions = [...data.map(notebook => ({ 
                label: notebook.Name, 
                value: notebook.Name 
            }))];
        } else if (error) {
            this.notebookOptions = [];
            this.error = error;
            console.error(error);
        }
    }

    // 페이징 핸들러
    handleNavigation(event) {
        this.currentPage = event.detail.page;
    }
    // 검색할 제품선택
    handleProductNameChange(event) {
        this.searchProd = event.detail.value;
        // console.log(this.searchProd);
    }
    
    // 판매일 선택(시작일)
    handleStartDateChange(event){
        this.startDate = event.detail.value;
        // console.log(this.startDate);
    }
    
    // 판매일 선택(종료일)
    handleEndDateChange(event){
        this.endDate = event.detail.value;
        if(this.startDate > this.endDate) {
            alert('시작일은 종료일보다 클 수 없습니다. 다시 선택해주세요.');
            this.endDate = '';
        }
        // console.log(this.endDate);
    }

    // 검색조건 초기화
    resetHandler() {
        this.searchProd = null; // null을 할당하여 UI를 업데이트하도록 합니다.
        this.startDate = null;
        this.endDate = null;
        this.currentPage = 1;
        const refreshEvent = new CustomEvent('refreshdata', {
            bubbles : true,
            composed: true
        });
        this.dispatchEvent(refreshEvent);
        refreshApex(this.saleRefresh);
    }

}


    // @wire(getAccountByName, { accountName: '$accountName' })
    // wiredAccountId({ data, error }) {
    //     if (data) {
    //         // console.log(data[0]);
    //         this.error = undefined;
    //         this.accountId = data[0].Id;
    //         // console.log('wiredAccountId : ' + this.accountId);
    //     } else {
    //         this.accountId = null;
    //         this.error = error;
    //     }
    // }

    // 기존 판매내역 가져오는 코드
    // // sales by location
    // @wire(getSalesByLocation, { location: '$location' })
    // wiredSales(result){
    //     if(result.data) {
    //         this.saleRefresh = result;
    //         this.error = undefined;
    //         let data = result.data;
    //         this.sales = [];
    //         if(data) {
    //             this.sales = data.map( (saleRecord)=>({
    //                 id: saleRecord.Id,
    //                 Location__c: saleRecord.Location__c,
    //                 status__c: saleRecord.status__c,
    //                 Sales_Date__c: saleRecord.Sales_Date__c,
    //                 // Sales_Date__c: new Intl.DateTimeFormat('en-US', {
    //                 //     dateStyle: 'short',
    //                 //     timeStyle: 'short'
    //                 // }).format(new Date(saleRecord.Sales_Date__c)),
    //                 Contact: saleRecord.Contact__r.Name,
    //                 Product_Name__c: saleRecord.Product_Name__c,
    //                 ProductPrice: saleRecord.Product__r.Price__c,
    //                 Product_Quantity__c: saleRecord.Product_Quantity__c,
    //                 Price__c: saleRecord.Price__c,
    //                 Discount__c: saleRecord.Discount__c,
    //                 // OwnerName: accRecord.Owner.Name,
    //                 // Phone: accRecord.Phone
    //             }));
    //         }
    //     } else if(result.error) {
    //         this.sales = undefined;
    //         this.error = error;
    //     }
    // }