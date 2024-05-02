import { LightningElement, wire, api } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { subscribe, unsubscribe, MessageContext, publish } from 'lightning/messageService';
import getLocationById from '@salesforce/apex/AccountService.getLocationById';
import getAccountByName from '@salesforce/apex/VocService.getAccountByName';
import SEARCH_TERM_CHANNEL from '@salesforce/messageChannel/SearchTermChannel__c';

export default class VocAccountMap extends LightningElement {
    mapMarkers = [];
    wiredAccountResult;
    subscription = null;

    @api accountId;
    @api accountName;
    @api refresh(){
        refreshApex(this.wiredAccountResult); //데이터 새로고침
    }

    @wire(MessageContext)
    messageContext;

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

    @wire(getLocationById, { accountId: '$accountId'})
    wiredAccount({ data, error }) {
        if (data) {
            this.error = undefined;

            if (data === '강원도') {
                this.mapMarkers = [{
                    location: {
                        City: 'Gangwon-do',
                        Country: 'Republic of Korea',
                        PostalCode: '24266',
                        State: 'Chuncheon-si',
                        Street: '1 Jungang-ro', 
                    }
                }]
            } else if (data === '경기도') {
                this.mapMarkers = [{
                    location: {
                        City: 'Gyeonggi-do',
                        Country: 'Republic of Korea',
                        PostalCode: '16508',
                        State: 'Yeongtong-gu Suwon-si',
                        Street: '30 Docheong-ro Yeongtong-gu', 
                    }
                }];
            } else if (data === '경상남도') {
                this.mapMarkers = [{
                    location: {
                        City: 'Gyeongsangnam-do',
                        Country: 'Republic of Korea',
                        PostalCode: '51154',
                        State: 'Uichang-gu Changwon-si',
                        Street: '300 Jungang-daero Uichang-gu', 
                    }
                }];
            } else if (data === '경상북도') {
                this.mapMarkers = [{
                    location: {
                        City: 'Gyeongsangbuk-do',
                        Country: 'Republic of Korea',
                        PostalCode: '36759',
                        State: 'Pungcheon-myeon Andong-si',
                        Street: '455 Docheong-daero', 
                    }
                }];
            } else if (data === '광주광역시') {
                this.mapMarkers = [{
                    location: {
                        City: 'Gwangju',
                        Country: 'Republic of Korea',
                        PostalCode: '61945',
                        State: 'Seo-gu',
                        Street: '11 Naebang-ro', 
                    }
                }];
            } else if (data === '대구광역시') {
                this.mapMarkers = [{
                    location: {
                        City: 'Daegu',
                        Country: 'Republic of Korea',
                        PostalCode: '41911',
                        State: 'Jung-gu',
                        Street: '88 Gongpyeong-ro' 
                    }
                }];
            } else if (data === '대전광역시') {
                this.mapMarkers = [{
                    location: {
                        City: 'Daejeon',
                        Country: 'Republic of Korea',
                        PostalCode: '35242',
                        State: 'Seo-gu',
                        Street: '100 Dunsan-ro' 
                    }
                }];
            }
            else if (data === '부산광역시') {
                this.mapMarkers = [{
                    location: {
                        City: 'Busan',
                        Country: 'Republic of Korea',
                        PostalCode: '47545',
                        State: 'Yeonje-gu',
                        Street: '1001 Jungang-daero' 
                    }
                }];
            } else if (data === '서울특별시') {
                this.mapMarkers = [{
                    location: {
                        City: 'Seoul',
                        Country: 'Republic of Korea',
                        PostalCode: '04524',
                        State: 'Jung-gu',
                        Street: '110 Sejong-daero', 
                    }
                }];
            } else if (data === '세종특별자치시') {  
                this.mapMarkers = [{
                    location: {
                        City: 'Sejong-si',
                        Country: 'Republic of Korea',
                        PostalCode: '30151',
                        State: '',
                        Street: '2130 Hannuri-daero', 
                    }
                }];
            } else if (data === '울산광역시') {
                this.mapMarkers = [{
                    location: {
                        City: 'Ulsan',
                        Country: 'Republic of Korea',
                        PostalCode: '44675',
                        State: 'Nam-gu',
                        Street: '201 Jungang-ro', 
                    }
                }];
            } else if (data === '인천광역시') {
                this.mapMarkers = [{
                    location: {
                        City: 'Incheon',
                        Country: 'Republic of Korea',
                        PostalCode: '21554',
                        State: 'Namdong-gu',
                        Street: '29 Jeonggak-ro', 
                    }
                }];    
            } else if (data === '전라남도') {
                this.mapMarkers = [{
                    location: {
                        City: 'Jeollanam-do',
                        Country: 'Republic of Korea',
                        PostalCode: '58564',
                        State: 'Muan-gun',
                        Street: '1 Oryong-gil Samhyang-eup', 
                    }
                }];   
            } else if (data === '전라북도') {
                this.mapMarkers = [{
                    location: {
                        City: 'Jeonbuk-do',
                        Country: 'Republic of Korea',
                        PostalCode: '54968',
                        State: 'Jeonju-si',
                        Street: '225 Hyoja-ro Wansan-gu', 
                    }
                }];
            } else if (data === '제주특별자치도') {
                this.mapMarkers = [{
                    location: {
                        City: 'Jeju-do',
                        Country: 'Republic of Korea',
                        PostalCode: '63122',
                        State: 'Jeju-si',
                        Street: '6 Munyeon-ro', 
                    }
                }];
            } else if (data === '충청남도') {
                this.mapMarkers = [{
                    location: {
                        City: 'Chungcheongnam-do',
                        Country: 'Republic of Korea',
                        PostalCode: '32255',
                        State: 'Hongseong-gun',
                        Street: '21 Chungnam-daero Hongbuk-eup', 
                    }
                }];
            } else if (data === '충청북도') {
                this.mapMarkers = [{
                    location: {
                        City: 'Chungcheongbuk-do',
                        Country: 'Republic of Korea',
                        PostalCode: '28515',
                        State: 'Cheongju-si',
                        Street: '82 Sangdang-ro Sangdang-gu', 
                    }
                }];
            }
        } else if (error) {
            this.mapMarkers = undefined;
            this.error = error;
        }
    }
    account;

}

// @wire(getAccountByName, { accountName: '$accountName' })
// wiredAccountId({ data, error }) {
//     this.wiredAccountResult = data;
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