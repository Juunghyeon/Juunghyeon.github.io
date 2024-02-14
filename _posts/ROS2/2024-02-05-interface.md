---
layout: single
title: "[ROS2] Interface 신규 작성"
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

# ROS2 인터페이스(Interface) 신규 작성
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

패키지 설정 파일은 ROS 패키지의 필수 구성 요소로서 패키지의 정보를 기술하는 파일이다. 기술하는 내용으로는 패키지 이름, 저작자, 라이선스, 의존성 패키지 등이 있으며 XML 형식으로 기술하고 파일명은 `package.xml`을 사용한다. 사용되는 빌드 툴, 의존성 패키지들이 모두 기술되기에 빌드 및 패키지 설치, 사용에 있어서 매우 중요한 파일이라고 말할 수 있다. 이에 모든 ROS 패키지의 필수 파일로 각 패키지당 무조건 1개의 패키지 설정 파일 (package.xml)을 포함하고 있다.

[출처] 022 패키지 파일 (환경 설정, 빌드 설정) (오픈소스 소프트웨어 & 하드웨어: 로봇 기술 공유 카페 (오로카)) | 작성자 표윤석

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

---
### 1-2. 빌드 설정 파일(CmakeList.txt)

ROS 2의 빌드 시스템인 ament[7]에서는 C++ 프로그래밍 언어를 사용한 패키지나 RQt Plugin의 경우 CMake(Cross Platform Make)를 이용하고 있고 패키지 폴더의 `CMakeLists.txt`라는 파일에 빌드 환경을 기술하여 사용하고 있다. 이 빌드 설정 파일에 실행 파일 생성, 의존성 패키지 우선 빌드, 링크 생성 등을 설정하게 되어 있다. ROS에서 CMake를 이용하는 이유는 ROS 패키지를 멀티 플랫폼에서 빌드할 수 있게 하기 위함이다. Make가 유닉스 계열만 지원하는 것과 달리, CMake는 유닉스 계열인 리눅스, BSD, OS X뿐만 아니라 윈도우즈 계열도 지원하기 때문이다. 또한 CMakeLists.txt은 Visual Studio, Eclipse, Qt Creator 등 다양한 IDE에서 기본으로 지원하여 쉽게 사용할 수 있다.

[출처] 022 패키지 파일 (환경 설정, 빌드 설정) (오픈소스 소프트웨어 & 하드웨어: 로봇 기술 공유 카페 (오로카)) | 작성자 표윤석

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

 ### 1-3. 빌드

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
<https://cafe.naver.com/openrt/24422>