import { LightningElement, wire, api } from 'lwc';
import { publish, MessageContext } from 'lightning/messageService';
import SEARCH_TERM_CHANNEL from '@salesforce/messageChannel/SearchTermChannel__c';

export default class VocSearch extends LightningElement {

    searchTerm;
    replaceValue = '';

    @api inputType = 'all';

    @wire(MessageContext)
    messageContext;

    get inputPlaceholder() {
        return this.inputType === 'number' ? '연락처를 입력해주세요.' : '검색어를 입력해주세요.';
    }

    handleKeyUp(event){
        // 숫자입력 정규식
        if(this.inputType === 'number'){
            const numbers = event.target.value.replace(/\D/g, '');
            if (numbers.length <= 3) {
                this.replaceValue = numbers;
            } else if (numbers.length > 3  && numbers.length <= 7) {
                this.replaceValue = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
            } else if (numbers.length > 7) {
                this.replaceValue = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
            }
            event.target.value = this.replaceValue;
        } else {
            this.replaceValue = event.target.value;
        }
        this.updateSearchTerm(this.replaceValue);
    }
    
    updateSearchTerm(replacedValue){
        this.searchTerm = replacedValue;
        publish(this.messageContext, SEARCH_TERM_CHANNEL, { searchTerm : this.searchTerm});
    }

}