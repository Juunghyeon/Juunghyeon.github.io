---
title: "[Algorithm] 비트마스크 (BitMask) 알고리즘"
categories: Algorithm
tags:
  - algorithn
  - BitMask
---

<!--MathJax-->

<script type="text/javascript" async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.3/MathJax.js?config=TeX-MML-AM_CHTML">
MathJax.Hub.Config({
    tex2jax: {
        inlineMath: [["$", "$"], ["\\(", "\\)"]],
        processEscapes: true
    }
});
</script>

## BitMask란
*비트마스크(BitMask)*란 이진수를 사용하는 컴퓨터의 연산 방식을 이용하여, 정수의 이진수 표현을 자료구조로 쓰는 기법을 말한다.

## BitMask의 장점
1. 빠른 수행시간   
- bit연산이므로 $O(1)$로 작동한다.
2. 간결한 코드
3. 적은 메모리 사용량
- $10$개의 bit는 $2^{10}$가지의 경우를 나타낼 수 있으며 수를 표현하기에 효율적이며, 데이터를 미리 계산하여 저장해둘 수 있다(DP).

## 비트 연산자

|연산|연산자|예시|
|:---|:---:|:---|
|AND 연산|'&'|11001 & 01100 ==> 01000|
|OR 연산|'&#124;'|11001 | 01100 ==> 11101|
|XOR 연산|'^'|11001 ^ 01100 ==> 10101|
|NOT 연산|'~'|~10011 ==> 01100|
|Shift 연산|'< <' or '> >'|110011 << 1 ==> 100110|

### 비트 연산자 주의점
1. C언어에서 <span style="color:red">비트 연산자들의 우선 순위는 비교 연산자보다 낮다</span>.   
ex) check = (6 & 4 == 4) 일 때, 4 == 4가 먼저 계산됨.
2. <span style="color:red">오버플로우(Overflow)</span>
1은 부호있는 32bit 상수로 취급한다. 따라서 32bit를 넘어가게 되면 오버플로우가 발생한다.
3. <span style="color:red">MSB(Most Significant Bit)</span>
signed int의 경우 가장 앞자리 bit는 부호를 의미한다. 따라서 shift 연산과정에서 버그가 발생할 수 있다. 변수의 모든 bit를 사용하고 싶다면 unsigned int 사용해야 한다.

### 비트 연산자의 활용
가장 대표적인 활용 방법은 **비트마스크를 이용한 집합 구현**이다.   
변수 A를 집합이라고 가정하고, 집합의 총원소의 개수를 10개라고 가정하자.
|연산|예시|설명|
|---|---|---|
|공집합과 꽉 찬 집합|A = 0<br>A = (1 << 10) - 1||
|원소 추가|A &#124;= (1 << k) | k번째에 원소 추가|
|원소 삭제|A &= ~(1 << k)|K번째에 원소 삭제|
|원소 포함 여부 확인|A & (1 << k)|$1$이면 존재, $0$이면 존재하지 않음|
|원소의 토글(toggle)|A ^= (1 << k)|해당 원소가 빠져있는 경우에는 추가, 있는 경우에는 삭제|
|두 집합에 대한 연산|A &#124; B<br>A & B<br>A & (~B)<br>A ^ B|A와 B의 합집합<br>A와 B의 교집합<br>A에서 B를 뺀 차집합<br>A와 B중 하나에만 포함된 원소들의 집합|
|최소 원소 찾기|A & (-A)||
|최소 원소 지우기|A &= (A - 1)||
|모든 부분 집합 순회하기|for (int subset = A; subset; subset = ((subset - 1) & A))||
   