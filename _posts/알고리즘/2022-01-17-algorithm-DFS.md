---
title: "[Algorithm] 깊이 우선 탐색(Depth-First Search)"
categories: Algorithm
tags:
  - algorithn
  - DFS
---

## CONCEPT
**Depth First Search(DFS)**는 그래프에서 사용되는 맹목적 탐색 방법의 하나이다. DFS는 *엣지(노선)* 기반 방법이며 경로를 따라 정점을 탐색하는 재귀 방식으로 작동한다. 탐색트리의 최근에 첨가된 노드를 선택하고, 이 노드에 적용 가능한 동작자 중 하나를 적용하여 트리에 다음 수준(level)의 한 개의 자식노드를 첨가하며, 첨가된 자식 노드가 목표노드일 때까지 앞의 자식 노드의 첨가 과정을 반복해 가는 방식이다.

<div style="text-align : center;">
	<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Depth-First-Search.gif/330px-Depth-First-Search.gif">
</div>   

## PROCEDURE
1. 시작정점(A)를 지정한다.
2. 정점에 방문처리를 하고 방문하지 않은 인접한 정점이 있는지 확인한다.   
   (있다면 인접한 정점을 기준으로 하고 2번을 반복한다.)
3. 

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