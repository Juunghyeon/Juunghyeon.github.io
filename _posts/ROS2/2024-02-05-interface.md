---
layout: single
title: "[ROS2] 인터페이스(Interface)"
categories:
  - ROS2
tag:
  - ROS2
  - interface
  - topic
  - action
  - service

toc: true
toc_sticky: true
---

# 인터페이스(Interface) 란?

인터페이스는 노드 간의 데이터 통신을 위한 규약을 정의한다. 이러한 인터페이스는 메시지(Message), 서비스(Service), 및 액션(Action)의 세 가지 주요 형태로 나뉜다.

ROS2 프로그래밍은 메시지 통신을 위해 정수, 부동 소수점, 불린과 같은 기본 변수 타입들이 담긴 std_msgs 인터페이스나 병진 속도와 회전 속도를 표현할 수 있는 geometry_msgs의 Twist.msg 인터페이스, 레지저 스캐닝 값을 담을 수 있는 sensor_msgs의 LaserScan.msg 인터페이스 같이 지정된 인터페이스를 사용하는 것이 일반적이다.

하지만 이러한 인터페이스들은 사용자가 원하는 모든 정보를 담을 수 없고 토픽 인터페이스 이외에 서비스나 액션 인터페이스는 매우 기본적인 인터페이스만 제공하기 때문에 사용자가 필요로 하는 형태가 아니면 새로 만들어야 한다.

그렇기 때문에 이번에는 ROS2 기초 프로그래밍 예제에서 사용할 **토픽(Topic), 서비스(Service), 액션(Action)** 관련 ROS2 인터페이스(Interface)를 신규로 작성해보자.

이번에는 **msg_srv_action_interface_example** 패키지를 만들 것이고 이 인터페이스 전용 패키지에는 다음과 같이 **msg 인터페이스, srv 인터페이스, action 인터페이스**를 포함시킬 예정이다.

- ArithmeticArgument.msg
- ArithmeticOperator.srv
- ArithmeticChecker.action

```bash
📦msg_srv_action_interface_example
 ┣ 📂action
 ┃ ┗ 📜ArithmeticChecker.action
 ┣ 📂include
 ┃ ┗ 📂msg_srv_action_interface_example
 ┣ 📂msg
 ┃ ┗ 📜ArithmeticArgument.msg
 ┣ 📂src
 ┣ 📂srv
 ┃ ┗ 📜ArithmeticOperator.srv
 ┣ 📜CMakeLists.txt
 ┗ 📜package.xml
```

---

## 1. 패키지 파일(환경 설정, 빌드 설정)

### 1-1. 패키지 설정 파일(package.xml)

```bash
<?xml version="1.0"?>
<?xml-model href="http://download.ros.org/schema/package_format3.xsd" schematypens="http://www.w3.org/2001/XMLSchema"?>
<package format="3">
  <name>msg_srv_action_interface_example</name>
  <version>0.0.0</version>
  <description>TODO: Package description</description>
  <maintainer email="ahdtld54@korea.ac.kr">jh</maintainer>
  <license>TODO: License declaration</license>

  <buildtool_depend>ament_cmake</buildtool_depend>
  
  <!--추가 내용-->
  <buildtool_depend>rosidl_default_generators</buildtool_depend>
  <exec_depend>builtin_interfaces</exec_depend>
  <exec_depend>rosidl_default_runtime</exec_depend>

  <test_depend>ament_lint_auto</test_depend>
  <test_depend>ament_lint_common</test_depend>
  <!---->

  <export>
    <build_type>ament_cmake</build_type>
  </export>
</package>
```

일반적인 패키지와 다른 점은 

1. **빌드 시에 DDS에서 가용되는 IDL(Interface Definition Language) 생성과 관련한 rosidl_default_generators가 사용된다는 점** 과
2. **실행 시에 builtin_interfaces와 rosidl_default_runtime이 사용된다는 점**

이다. 그 이외에는 일반적인 패키지의 설정과 동일하다.

---
### 1-2. 빌드 설정 파일(CmakeList.txt)

```bash
################################################################################
# Set minimum required version of cmake, project name and compile options
################################################################################
cmake_minimum_required(VERSION 3.5)
project(msg_srv_action_interface_example)

if(NOT CMAKE_CXX_STANDARD)
  set(CMAKE_CXX_STANDARD 14)
endif()

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -Wpedantic")
endif()

################################################################################
# Find and load build settings from external packages
################################################################################
find_package(ament_cmake REQUIRED)
find_package(builtin_interfaces REQUIRED)
find_package(rosidl_default_generators REQUIRED)

################################################################################
# Declare ROS messages, services and actions
################################################################################
set(msg_files
  "msg/ArithmeticArgument.msg"
)

set(srv_files
  "srv/ArithmeticOperator.srv"
)

set(action_files
  "action/ArithmeticChecker.action"
)

rosidl_generate_interfaces(${PROJECT_NAME}
  ${msg_files}
  ${srv_files}
  ${action_files}
  DEPENDENCIES builtin_interfaces
)

################################################################################
# Macro for ament package
################################################################################
ament_export_dependencies(rosidl_default_runtime)
ament_package()
```

ROS 2에서 자신만의 인터페이스 파일 (msg, srv, action)을 사용하는 경우에는 rosidl_generate_interfaces 을 사용하여 인터페이스를 추가해야 한다.

`<member_of_group>` 태그는 ROS 2의 ament 빌드 시스템에서 사용되는 특정한 메타데이터 태그 중 하나이다. 이 태그는 패키지가 속한 그룹을 정의한다. 그룹은 패키지들을 논리적으로 묶어 관리할 수 있도록 돕는 메커니즘으로 사용된다. **이 태그는 ROS 2 빌드 시스템에서 메시지 및 서비스 인터페이스를 가진 패키지가 반드시 가져야 하는 메타데이터 중 하나이다.**




## 2. 인터페이스 파일(Interface Files)
### 2.1. ArithmeticArgument.msg

```
# Messages
builtin_interfaces/Time stamp
float32 argument_a
float32 argument_b
```

### 2.2. ArithmeticOperator.srv

```
# Constants
int8 PLUS = 1
int8 MINUS = 2
int8 MULTIPLY = 3
int8 DIVISION = 4

# Request
int8 arithmetic_operator
---
# Response
float32 arithmetic_result
```

### 2.3. ArithmeticChecker.action

```
# Goal
float32 goal_sum
---
# Result
string[] all_formula
float32 total_sum
---
# Feedback
string[] formula
```

## 3. 빌드

```bash
$ cd ~/ws
$ cbp msg_srv_action_interface_example
Starting >>> msg_srv_action_interface_example
Finished <<< msg_srv_action_interface_example [1.81s]                     

Summary: 1 package finished [3.63s]
 ```

빌드 이후에는 ROS 인터페이스를 사용하기 위한 파일들이 생성된다.

---
## Reference
- [ROS 2로 시작하는 로봇 프로그래밍 | 표윤석](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&cad=rja&uact=8&ved=2ahUKEwitt6_ryruEAxUCZvUHHV5oA4oQFnoECBEQAQ&url=https%3A%2F%2Fproduct.kyobobook.co.kr%2Fdetail%2FS000001891112&usg=AOvVaw14QJXxcjs_wribUachvF8x&opi=89978449)

- <https://cafe.naver.com/openrt/24422>