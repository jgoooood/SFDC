import { LightningElement } from 'lwc';

export default class vocAccountLayoutManager extends LightningElement {
    selectedAccount;

    handleAccountSelect(event) {
        this.selectedAccount = event.detail;
    }

    handleRefresh() {
        this.selectedAccount = '';
        // 각 하위 컴포넌트의 새로고침 메서드 호출
        this.template.querySelectorAll('c-voc-sales-table, c-voc-account-table, c-voc-account-map')
            .forEach(component => {
                if (typeof component.refresh === 'function') {
                    component.refresh(); // refresh는 각 컴포넌트에서 정의해야 하는 메서드입니다.
                }
            });
    }
}

