---
layout: single
title: "[ROS2] 빌드 설정 파일(CMakeLists.txt)"
categories:
  - ROS2
tag:
  - ROS2

toc: true
toc_sticky: true
---

# CMakeLists.txt 파일이란?
ROS2의 빌드 시스템은 ament에서는 C++ 프로그래밍 언어를 사용한 패키지나 RQt Plugin의 경우 CMake (Cross Platform Make)를 이용하고 있고 패키지 폴더의 CMakeLists.txt 파일에 빌드 환경을 기술해 사용하고 있다.
이 빌드 설정 파일에 생성, 의존성 패키지 우선 빌드, 링크 생성 등을 설정한다.

## 명령어

### 1. add_ececutable() - 빌드 대상 바이너리 추가
이 함수는 실행 가능한 바이너리를 생성하는 데 사용된다. 주어진 소스 파일들을 컴파일하여 실행 가능한 프로그램을 생성한다. 

```cmake
add_executable( <실행_파일명> <소스_파일> <소스_파일> ... )

add_executable(my_node src/my_node.cpp)
```

### 2. ament_target_dependencies() - 패키지 간 의존성 관리
이 함수는 빌드 타겟이 다른 패키지에 종속되어 있는 경우에 사용된다. ROS 2에서는 패키지 간의 의존성을 관리하기 위해 사용된다.

```cmake
ament_target_dependencies(<실행_파일명> <종속성1> <종속성2> ... )

ament_target_dependencies(my_node rclcpp std_msgs)
```


### 3. install() - 설치 매크로(make install) 정의
install은 빌드한 파일들을 시스템에 설치하는 데 사용된다. 이것은 보통 패키지의 라이브러리, 실행 파일, 헤더 파일 등을 시스템의 적절한 위치로 복사하여 다른 프로젝트에서 사용할 수 있도록 하는 과정이다. install 명령은 패키지를 빌드하고 나면 빌드된 파일들을 설치할 위치를 지정한다.

일반적으로 CMakeLists.txt 파일의 install 부분은 다음과 같은 구조를 가진다.

```cmake
install(
    TARGETS my_library
    ARCHIVE DESTINATION lib
    LIBRARY DESTINATION lib
    RUNTIME DESTINATION bin
)

install(
    TARGETS <Target_목록>
    ARCHIVE DESTINATION <아카이브_설치_경로>
    LIBRARY DESTINATION <라이브러리_설치_경로>
    RUNTIME DESTINATION <바이너리_설치_경로>
)
```

## Reference
[ROS 2로 시작하는 로봇 프로그래밍 | 표윤석](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&cad=rja&uact=8&ved=2ahUKEwitt6_ryruEAxUCZvUHHV5oA4oQFnoECBEQAQ&url=https%3A%2F%2Fproduct.kyobobook.co.kr%2Fdetail%2FS000001891112&usg=AOvVaw14QJXxcjs_wribUachvF8x&opi=89978449)