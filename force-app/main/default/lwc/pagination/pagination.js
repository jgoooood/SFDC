import { LightningElement, api } from 'lwc';

export default class Pagination extends LightningElement {
    @api currentPage = 1;
    @api totalPages = 1;

    // 'Previous' 버튼을 비활성화할지 결정하는 getter
    get isPrevDisabled() {
        return this.currentPage <= 1;
    }

    // 'Next' 버튼을 비활성화할지 결정하는 getter
    get isNextDisabled() {
        return this.currentPage >= this.totalPages;
    }

    get pageNumbers() {
        const range = [];
        const numPagesToShow = 5; // 한 번에 보여줄 페이지 수를 5개로 설정
    
        let start = Math.max(this.currentPage - Math.floor(numPagesToShow / 2), 1);
        let end = Math.min(start + numPagesToShow - 1, this.totalPages);
    
        if (end - start + 1 < numPagesToShow) {
            start = Math.max(end - numPagesToShow + 1, 1);
        }
    
        for (let i = start; i <= end; i++) {
            range.push({
                number: i,
                variant: i === this.currentPage ? 'brand' : 'neutral'
            });
        }
    
        return range;
    }

    handlePrev() {
        if (this.currentPage > 1) {
            this.dispatchEvent(new CustomEvent('navigate', { detail: { page: this.currentPage - 1 } }));
        }
    }
    
    handleNext() {
        if (this.currentPage < this.totalPages) {
            this.dispatchEvent(new CustomEvent('navigate', { detail: { page: this.currentPage + 1 } }));
        }
    }

    // handlePageSelect(event) {
    //     const page = event.currentTarget.dataset.page;
    //     console.log(page);
    //     this.dispatchEvent(new CustomEvent('navigate', { detail: { page: parseInt(page, 10) } }));
    // }

    handlePageSelect(event) {
        const selectedPage = parseInt(event.currentTarget.dataset.page, 10);
        this.dispatchEvent(new CustomEvent('navigate', { detail: { page: selectedPage } }));
    }
    
    
}