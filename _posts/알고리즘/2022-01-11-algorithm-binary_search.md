---
layout: single
title: "[Algorithm] 이진탐색(Binary Search)"
# excerpt: "단계 | 번호: 문제이름"
categories:
  - Algorithm
tag:
  - Cpp
  - 알고리즘
  - 이진탐색

toc: true
---

## CONCEPT
이진탐색 알고리즘이란 오름차순으로 정렬된 리스트에서 특정한 값의 위치를 찾는 알고리즘이다. 한 번의 계산을 통해 검색 대상 데이터의 양이 절반씩 줄어들기 때문에 시간복잡도는 O(logN)이다.   
   
이진탐색을 사용하는 경우는 대개 탐색범위가 너무 커서 일반적인 탐색으로는 시간이 너무 오래걸릴 때의 경우이다. 해결해야 하는 문제의 조건을 잘 살펴보고 만약 탐색 범위가 너무 크다고 느껴지면 이진탐색을 한 번 생각해보도록 하자.    
이진탐색이 정상적으로 진행하도록 하기 위한 기본적인 조건을 정리하자면,   
첫 번째, **오름차순**으로 정렬되어 있어야 한다.
두 번째, **시작점(start)**과 **끝점(end)**를 확실히 해야한다.   
   
이진탐색 알고리즘을 직관적으로 나타낸 그림은 다음과 같다. 아래와 같이 17개 요소로 이루어진 리스트에서 7의 위치를 찾는 이진탐색 알고리즘은 화살표 방향처럼 수행된다.
<div style="text-align : center;">
	<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Binary_Search_Depiction.svg/330px-Binary_Search_Depiction.svg.png">
</div>   

## PROCEDURE
- left를 0으로 초기화, right를 검색하는 리스트(배열)의 마지막 원소의 인텍스로 초기화
- mid 변수를 (left + right)/2 로 설정하며 계속해서 탐색
- left > right가 되는 순간 탐색이 종료되고 그 전에 해당값을 찾으면 종료

## DODE (C/C++)
```cpp
int* binarySearch(int key,const int *target,size_t length) {
    int first = 0, last = length - 1, middle = (first + last) / 2;
 
    while (first <= last) {     
 
        if (target[middle] == key)
            return target + middle;
 
        if (target[middle] > key)
            last = middle - 1;
        else
            first = middle + 1;
 
        middle = (first + last) / 2;
    }
 
    return NULL;
}
```

