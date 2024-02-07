---
layout: single
title: "[ROS2] ros2_control_demos"
categories:
  - ROS2
tag:
  - ROS2
  - ros2_control_demos

toc: true
toc_sticky: true
---

# INTRO
ROS2에서 control과 관련한 데모가 있어서 공부해보자. example 별로 실습을 진행할 수 있어서 control 과 관련하여 공부하는 데 많은 도움이 될 것 같다.

## 빌드과정

일단 workspace를 생성하자.

```bash
$ mkdir -p ros2_control_ws/src
```

이후 github에 들어가서 오픈소스의 주소를 가져온 뒤 git clone 을 진행해주면 되는데, 이때 주의할 것은 branch에서 foxy를 선택해주어야 한다.

![image](https://github.com/Juunghyeon/test/assets/78840944/64d57e2e-23a7-4f00-9ab9-a974a564ad71)

일반적으로 오픈 소스 프로젝트는 여러 개발 라인이나 기능 세트를 동시에 관리하기 위해 여러 가지 브랜치를 유지한다. 이러한 브랜치들은 주로 다음과 같은 목적으로 사용된다:

1. 기능 개발
2. 버그 수정
3. 릴리스 관리
4. 실험적인 기능
5. 협업 및 팀 관리

따라서 오픈 소스 프로젝트를 가져올 때 적절한 브랜치를 선택하여 해당 브랜치의 코드를 가져오는 것이 중요하다. (처음에 나는 이것을 몰라서 빌드 에러가 계속 발생했다.)

```bash
$ cd ~/ros2_control_ws/src
$ git clone -b foxy https://github.com/ros-controls/ros2_control_demos.git
```

이후 `~/ros2_control_demos/src/ros2_control_demos` 디렉터리를 확인해보면 아래와 같다.

```bash
jh@jh-H110M-DS2V:~/ros2_control_demos/src$ cd ros2_control_demos/
jh@jh-H110M-DS2V:~/ros2_control_demos/src/ros2_control_demos$ ls
codecov.yml                    ros2_control_demos
CONTRIBUTING.md                ros2_control_demos.foxy.repos
doc                            ros2_control_demos.galactic.repos
LICENSE                        ros2_control_demos-not-released.foxy.repos
README.md                      ros2_control_demos-not-released.galactic.repos
ros2_control_demo_bringup      ros2_control_demos-not-released.rolling.repos
ros2_control_demo_description  ros2_control_demos.rolling.repos
ros2_control_demo_hardware     ros2_control_test_nodes
```

여기서 `vcs import` 명령을 통해 `ros2_control_demos/ros2_control_demos.foxy.repos` 파일을 사용하여 ROS 2 컨트롤 데모 관련 패키지의 소스코드를 가져온다. 이때 `--input` 옵션을 사용하여 `ros2_control_demos/ros2_control_demos.foxy.repos` 파일을 지정합니다.

명령을 실행하면 `vcs`가 각 저장소의 URL에서 소스코드를 다운로드하여 지정된 로컬 경로에 저장한다.

이렇게 하면 로컬 시스템에 ROS 2 컨트롤 데모 관련 패키지의 소스코드가 다운로드되고 저장되며, 이후에 빌드하거나 사용할 수 있다.

