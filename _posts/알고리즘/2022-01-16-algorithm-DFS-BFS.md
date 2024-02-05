---
title: "[Algorithm] DFS와 BFS의 차이점"
categories: Algorithm
tags:
  - dfs
  - bfs
  - algorithm
toc: true
---
## 공통점
**BFS**와 **DFS** 모두 그래프를 탐색하는 방법이다.   
그래프란 *정점(node)*과 그 정점을 연결하는 *간선(edge)*으로 이루어진 자료구조의 일종을 말하며, 그래프를 탐색한다는 것은 하나의 정점으로부터 시작하여 차례대로 모든 정점들을 한 번씩 방문하는 것을 의미한다.

## DFS와 BFS 비교

<div style="text-align : center;">
	<img src="https://media.vlpt.us/images/lucky-korma/post/e2ef7ac3-14e6-42e7-a768-224c5f773e29/R1280x0-3.gif">
</div>   
   
|DFS|BFS|
|---|---|
|**간선(edge)** 기반|**정점(node)** 기반|
|**스택** 또는 **재귀함수**로 구현|**큐(Queue)**를 이용해서 구현|
|모든 정점의 탐색|최적성 판단|

### 간선(edge) 기반과 정점(node) 기반의 의미
#### 간선(edge) 기반(DFS)
<div style="text-align : center;" width="100" height="100">
	<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Depth-First-Search.gif/330px-Depth-First-Search.gif">
</div>  
   
탐색 시 임의의 선택된 분기(branch)에 대해 끝까지 탐색 후 다음 분기를 탐색하게 된다.   
따라서 여러 개의 분기가 있을 때 각각의 경로는 다른 경로들과 분리되어 생각할 수 있다는 특징이 있다.   
이렇게 되면 각각의 경로에 대한 정보를 저장하거나 경로가 주어진 조건에 부합하는지에 대한 여부를 확인할 수 있다.   
DFS가 임의의 경로에 대한 탐색을 진행하던 중 조건에 부합하지 않다면 가장 최근의 경로의 분기점으로 되돌아가 다른 경로를 진행하는 것*(백트래킹)* 또한 가능하다.   

#### 정점(node) 기반(BFS)
<div style="text-align : center;">
	<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Breadth-First-Search-Algorithm.gif/330px-Breadth-First-Search-Algorithm.gif">
</div>   
   
탐색 시 루트노드(혹은 임의의 노드)에서부터 인접한 노드를 먼저 탐색하는 방법이다.   
이 때 모든 노드에 대한 메모리를 유지하는 것 또한 중요하며, 임의의 두 노드에 대한 최적성을 판단하기에 유리하다.
## 참조
[](https://velog.io/@lucky-korma/DFS-BFS%EC%9D%98-%EC%84%A4%EB%AA%85-%EC%B0%A8%EC%9D%B4%EC%A0%90)   
[](https://ko.gadget-info.com/difference-between-bfs)   
[](https://velog.io/@ming/DFS-vs-BFS-%ED%83%90%EC%83%89)