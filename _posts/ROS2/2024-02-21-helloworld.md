---
layout: single
title: "[ROS2] Hello World"
categories:
  - ROS2
tag:
  - ROS2
  - CPP

toc: true
toc_sticky: true
---

# Intro
C++ 언어로 간단한 구조의 토픽(Topic) 퍼블리셔(Publisher)와 서브스크라이버(Subscriber)를 작성하고 동작시켜보자.

## 1. Package Directory

```
📦my_first_ros_rclcpp_pkg
 ┣ 📂include
 ┃ ┗ 📂my_first_ros_rclcpp_pkg
 ┣ 📂src
 ┃ ┣ 📜helloworld_publisher.cpp
 ┃ ┗ 📜helloworld_subscriber.cpp
 ┣ 📜CMakeLists.txt
 ┗ 📜package.xml
```

## 2. Code
### 2.1. CMakeLists.txt

```bash
# Default to C++14
if(NOT CMAKE_CXX_STANDARD)
  set(CMAKE_CXX_STANDARD 14)
endif()

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

# find dependencies
find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(std_msgs REQUIRED)

# Build
add_executable(helloworld_publisher src/helloworld_publisher.cpp)
ament_target_dependencies(helloworld_publisher rclcpp std_msgs)

add_executable(helloworld_subscriber src/helloworld_subscriber.cpp)
ament_target_dependencies(helloworld_subscriber rclcpp std_msgs)

# Install
install(TARGETS
  helloworld_publisher
  helloworld_subscriber
  DESTINATION lib/${PROJECT_NAME})

if(BUILD_TESTING)
  find_package(ament_lint_auto REQUIRED)
  # the following line skips the linter which checks for copyrights
  # uncomment the line when a copyright and license is not present in all source files
  #set(ament_cmake_copyright_FOUND TRUE)
  # the following line skips cpplint (only works in a git repo)
  # uncomment the line when this package is not in a git repo
  #set(ament_cmake_cpplint_FOUND TRUE)
  ament_lint_auto_find_test_dependencies()
endif()

ament_package()
```

기본 패키지의 `CMakeLists.txt` 파일에서 아래의 부분을 추가한 것이다.

```bash
# Build
add_executable(helloworld_publisher src/helloworld_publisher.cpp)
ament_target_dependencies(helloworld_publisher rclcpp std_msgs)

add_executable(helloworld_subscriber src/helloworld_subscriber.cpp)
ament_target_dependencies(helloworld_subscriber rclcpp std_msgs)

# Install
install(TARGETS
  helloworld_publisher
  helloworld_subscriber
  DESTINATION lib/${PROJECT_NAME})
```

내용은 다음과 같이 정리할 수 있다.

- `src/helloworld_publisher.cpp`을 컴파일하여 `helloworld_publisher` 실행파일 생성
- `src/helloworld_subscriber.cpp`을 컴파일하여 `helloworld_subscriber` 실행파일 생성
- 실행파일 `helloworld_publish`과 `helloworld_subscriber` 은 패키지 `rclcpp` 과 `std_msgs`에 의존성을 가짐
- 실행파일 `helloworld_publish`과 `helloworld_subscriber` 은 작업공간(workspace)의 디렉토리 `lib/${PROJECT_NAME}` 에 저장

빌드를 완료해준 후에 디렉터리를 확인해보면 다음과 같음을 확인할 수 있다.

![image](https://github.com/Juunghyeon/images/assets/78840944/87d32f1a-6864-48c3-8313-7f2990e7f5c2)

### 2.2. helloworld_publisher.cpp

```cpp
/ Copyright 2016 Open Source Robotics Foundation, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#include <chrono>
#include <functional>
#include <memory>
#include <string>

#include "rclcpp/rclcpp.hpp"
#include "std_msgs/msg/string.hpp"

#include <iostream>

using namespace std::chrono_literals;
using namespace std;

class HelloworldPublisher : public rclcpp::Node
{
public:
  HelloworldPublisher()
  : Node("helloworld_publisher"), count_(0)
  {
    auto qos_profile = rclcpp::QoS(rclcpp::KeepLast(10));
    helloworld_publisher_ = this->create_publisher<std_msgs::msg::String>(
      "helloworld", qos_profile);
    timer_ = this->create_wall_timer(
      1s, std::bind(&HelloworldPublisher::publish_helloworld_msg, this));
  }

private:
  void publish_helloworld_msg()
  {
    auto msg = std_msgs::msg::String();
    msg.data = "Hello World: " + std::to_string(count_++);
    RCLCPP_INFO(this->get_logger(), "Published message: '%s'", msg.data.c_str());
    helloworld_publisher_->publish(msg);
  }
  rclcpp::TimerBase::SharedPtr timer_;
  rclcpp::Publisher<std_msgs::msg::String>::SharedPtr helloworld_publisher_;
  size_t count_;
};


int main(int argc, char * argv[])
{
  cout << "PUB: rclcpp::init(argc, argv);\n";
  rclcpp::init(argc, argv);
  auto node = std::make_shared<HelloworldPublisher>();
  cout << "PUB: rclcpp::spin(node);\n";
  rclcpp::spin(node);
  cout << "PUB: rclcpp::shutdown();\n";
  rclcpp::shutdown();
  
  return 0;
}
```

퍼블리셔 노드의 cpp 내용을 정리하면 다음과 같다.

- 해당 노드의 메인 클래스는 rclcpp의 Node 클래스를 상속
    ```cpp
    class HelloworldPublisher : public rclcpp::Node
    ```
- 퍼블리셔 의 Qos에서 KeepLast 형태로 depth을 10으로 설정
    ```cpp
    auto qos_profile = rclcpp::QoS(rclcpp::KeepLast(10));
    ```
- Node 클래스의 create_publisher 함수를 이용하여 퍼블리셔 설정. 매개변수의 토픽 메시지 타입은 `String`, 토픽 이름은 `"helloworld"`, QoS는 `qos_profile`
    ```cpp
    helloworld_publisher_ = this->create_publisher<std_msgs::msg::String>(
      "helloworld", qos_profile);
    ```
- Node 클래스의 create_wall_timer 함수를 이용해 콜백 함수 실행. 주기는 1s.
    ```cpp
    timer_ = this->create_wall_timer(
      1s, std::bind(&HelloworldPublisher::publish_helloworld_msg, this));
    ```
- 콜백 함수
    ```cpp
    void publish_helloworld_msg()
  {
    auto msg = std_msgs::msg::String();
    msg.data = "Hello World: " + std::to_string(count_++);
    RCLCPP_INFO(this->get_logger(), "Published message: '%s'", msg.data.c_str());
    helloworld_publisher_->publish(msg);
  }
    ```

### 2.3. helloworld_subscriber.cpp

서브스크라이브 함수도 퍼블리시 함수와 비슷하다.

```cpp
// Copyright 2016 Open Source Robotics Foundation, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#include <functional>
#include <memory>

#include "rclcpp/rclcpp.hpp"
#include "std_msgs/msg/string.hpp"

#include <iostream>

using std::placeholders::_1;
using namespace std;

class HelloworldSubscriber : public rclcpp::Node
{
public:
  HelloworldSubscriber()
  : Node("Helloworld_subscriber")
  {
    auto qos_profile = rclcpp::QoS(rclcpp::KeepLast(10));
    helloworld_subscriber_ = this->create_subscription<std_msgs::msg::String>(
      "helloworld",
      qos_profile,
      std::bind(&HelloworldSubscriber::subscribe_topic_message, this, _1));
  }

private:
  void subscribe_topic_message(const std_msgs::msg::String::SharedPtr msg) const
  {
    RCLCPP_INFO(this->get_logger(), "Received message: '%s'", msg->data.c_str());
  }
  rclcpp::Subscription<std_msgs::msg::String>::SharedPtr helloworld_subscriber_;
};


int main(int argc, char * argv[])
{
  cout << "SUB: rclcpp::init(argc, argv);\n";
  rclcpp::init(argc, argv);
  auto node = std::make_shared<HelloworldSubscriber>();
  cout << "SUB: rclcpp::spin(node);\n";
  rclcpp::spin(node);
  cout << "SUB: rclcpp::shutdown();\n";
  rclcpp::shutdown();
  return 0;
}
```


## 3. Run

빌드를 진행한 뒤에 실행을 시켜보면 다음과 같다. 함수 호출 순서를 확인해 보기 위해서 `cout` 부분을 추가하였다.

![image](https://github.com/Juunghyeon/images/assets/78840944/65a91cab-e70a-4532-a082-76fb598f3422)

`rqt_graph` 를 통해서 노드와 토픽을 살펴보자.

![image](https://github.com/Juunghyeon/images/assets/78840944/b92d20d8-e0d1-4ddd-b600-fd841f7629c9)

## Reference
[ROS 2로 시작하는 로봇 프로그래밍 | 표윤석](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&cad=rja&uact=8&ved=2ahUKEwitt6_ryruEAxUCZvUHHV5oA4oQFnoECBEQAQ&url=https%3A%2F%2Fproduct.kyobobook.co.kr%2Fdetail%2FS000001891112&usg=AOvVaw14QJXxcjs_wribUachvF8x&opi=89978449)