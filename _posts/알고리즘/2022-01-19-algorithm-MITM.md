---
title: "중간에서 만나기(Meet In The Middle, MITM)"
categories: Algorithm
tags:
  - algorithm
  - MITM
toc: true
---
## CONCEPT
**중간에서 만나기(Meet In The Middle)** 알고리즘은 조합 가능한 모든 경우를 대입해 보는 *부루트포스(BruteForce)* 알고리즘을 사용할 때 경우의 수가 너무 많을 때 사용되는 검색 기술이다. *분할 정복*과 마찬가지로 문제를 둘로 나누고 개별적으로 해결한 다음 병합하는 방식이다.   
예를 들어 크기가 N인 배열 원소의 모든 조합을 고려해야 할 때, N이 40이라면 2^40개의 연산을 해야 한다. 10억번의 연산에 걸리는 시간이 약 1초라고 했을 때, 2^40(약 10조)번의 연산에 걸리는 시간은 약 1000초이다. 이럴 때 사용하는 기법이 MITM 알고리즘이다.   
**MITM**과 *분할정복* 비슷한 형태를 취하지만, 분할정복은 다수의 작은 문제 해결을 통해 하나의 커다란 하나의 문제를 해결한다면 MITM은 작은 문제 해결과 더불어 +a의 연산이 필수적이라는 점에서 차이점이 있다.  

## CODE
```cpp
// C++ program to demonstrate working of Meet in the
// Middle algorithm for maximum subset sum problem.
#include <bits/stdc++.h>
using namespace std;
typedef long long int ll;
ll X[2000005],Y[2000005];
 
// Find all possible sum of elements of a[] and store
// in x[]
void calcsubarray(ll a[], ll x[], int n, int c)
{
    for (int i=0; i<(1<<n); i++)
    {
        ll s = 0;
        for (int j=0; j<n; j++)
            if (i & (1<<j))
                s += a[j+c];
        x[i] = s;
    }
}
 
// Returns the maximum possible sum less or equal to S
ll solveSubsetSum(ll a[], int n, ll S)
{
    // Compute all subset sums of first and second
    // halves
    calcsubarray(a, X, n/2, 0);
    calcsubarray(a, Y, n-n/2, n/2);
 
    int size_X = 1<<(n/2);
    int size_Y = 1<<(n-n/2);
 
    // Sort Y (we need to do doing binary search in it)
    sort(Y, Y+size_Y);
 
    // To keep track of the maximum sum of a subset
    // such that the maximum sum is less than S
    ll max = 0;
 
    // Traverse all elements of X and do Binary Search
    // for a pair in Y with maximum sum less than S.
    for (int i=0; i<size_X; i++)
    {
        if (X[i] <= S)
        {
            // lower_bound() returns the first address
            // which has value greater than or equal to
            // S-X[i].
            int p = lower_bound(Y, Y+size_Y, S-X[i]) - Y;
 
            // If S-X[i] was not in array Y then decrease
            // p by 1
            if (p == size_Y || Y[p] != (S-X[i]))
                p--;
 
            if ((Y[p]+X[i]) > max)
                max = Y[p]+X[i];
        }
    }
    return max;
}
 
// Driver code
int main()
{
    ll a[] = {3, 34, 4, 12, 5, 2};
    int n=sizeof(a)/sizeof(a[0]);
    ll S = 10;
    printf("Largest value smaller than or equal to given "
           "sum is %lld\n", solveSubsetSum(a,n,S));
    return 0;
}
```   
   
참고사이트   
[GeeksForGeeks](https://www.geeksforgeeks.org/meet-in-the-middle/?ref=gcse)