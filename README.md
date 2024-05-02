# 🙋🏻‍♀️담당기능

1. **상담**

- 판매점 판매사원의 오프라인 상담 **CRED 기능** 구현
- 상담 유형, 판매점, 상품, 고객 등록 등 **유효성 검사(에러메시지)** 구현
- 구매 고객의 상담 등록 또는 삭제 시 **상담 횟수 변경 Trigger** 구현

![15](https://github.com/jgoooood/SFDC/assets/134674345/96e10ca8-ead7-4ce6-9796-e320249ac83a)

![14](https://github.com/jgoooood/SFDC/assets/134674345/81d062d6-a7e6-428e-bf6a-c6e50019c583)

![10](https://github.com/jgoooood/SFDC/assets/134674345/28602d6a-6fd8-4b82-90c7-1da88c34fb30)

---

2. **VoC
(고객센터)**

- 본사 관리자의 VoC(고객센터) **CRED 기능** 구현
- 고객마다 구매(보유)한 제품 리스트 **동적 쿼리**
- 구매 고객의 VoC 등록 또는 삭제 시 **VoC 횟수 변경 Trigger** 구현
- VoC 상담 종료 시 Trigger 구현
    - 고객에게 상담 종료 안내 **메일 발송 Trigger**
    - 종료 완료된 시점의 **날짜 저장 Trigger**

![16](https://github.com/jgoooood/SFDC/assets/134674345/852d32b0-9570-4e26-a85a-e04785761bb3)

![17](https://github.com/jgoooood/SFDC/assets/134674345/1b1a15b1-75a7-46f5-9296-1e9d749e428a)

![18](https://github.com/jgoooood/SFDC/assets/134674345/309e4319-c2ab-43b9-962a-9c6511710f65)

---

3. **노트북 판매조회**

- 본사관리자와 Admin만 접근 가능한 노트북 매출 내역 페이지
- 실제 노트북 매출에 따라 바뀌는 순위
- 판매점, 제품코드, 판매일 선택에 따라 조건에 만족하는 내역 조회

![19](https://github.com/jgoooood/SFDC/assets/134674345/113cb43b-4abd-4777-97ce-ea4a8cb0ab86)

---

4. **공통 컴포넌트**

- **재사용성**을 높이기 위한 공통 컴포넌트 구현
    - Modal (등록을 위한 컴포넌트)
    - Pagination
    - Search

---

# 🛠️사용 기술

- **Salesfoce** : `Apex` `LWC` `SOQL` `Admin`
- **Language** : `JavaScript` `HTML` `CSS`
- **Tools** : `VS Code` `Slack`
