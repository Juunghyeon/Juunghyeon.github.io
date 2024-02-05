---
title: "[Algorithm] 너비 우선 탐색(Breadth-First Search)"
categories: Algorithm
tags:
  - algorithn
  - BFS
---

## CONCEPT
**Breadth First Search(BFS)**는 그래프에서 사용되는 맹목적 탐색 방법의 하나이다. 이 방법에서는 그래프의 *정점*에 강조가 있다. 시작 정점을 방문한 후 시작 정점에 인접한 모든 정점들을 우선 방문하는 방법이다. 더 이상 방문하지 않은 정점이 없을 때까지 방문하지 않은 모든 정점들에 대해서도 너비 우선 검색을 적용한다. 이 때 *큐(queue)* 자료구조를 사용한다.

<div style="text-align : center;">
	<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Breadth-First-Search-Algorithm.gif/330px-Breadth-First-Search-Algorithm.gif">
</div>   

## PROCEDURE
1. 시작정점를 지정하고 *큐(Queue)*에 넣어주고 방문처리 한다.
2. 큐에서 하나의 정점를 꺼내고, 꺼낸 정점에 연결된 정점들 중 방문처리 되지 않은 정점을 *큐(Queue)*에 넣어주고 방문처리 한다.
3. *큐(Queue)*에 아무것도 남아있지 않으면 종료한다.

## CODE
```cpp
#include <iostream>
#include <vector>
#include <queue>

using namespace std;

bool visited[9];
vector<int> graph[9];

// BFS 함수 정의
void bfs(int start) {
    queue<int> q;
    q.push(start); // 첫 노드를 queue에 삽입
    visited[start] = true; // 첫 노드를 방문 처리

    // 큐가 빌 때까지 반복
    while (!q.empty()) {
        // 큐에서 하나의 원소를 뽑아 출력
        int x = q.front();
        q.pop();
        cout << x << ' ';
        // 해당 원소와 연결된, 아직 방문하지 않은 원소들을 큐에 삽입
        for (int i = 0; i < graph[x].size(); i++) {
            int y = graph[x][i];
            if (!visited[y]) {
                q.push(y);
                visited[y] = true;
            }
        }
    }
}
```