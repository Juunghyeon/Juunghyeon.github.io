---
layout: single
title: "[Gazebo] 폴더 구조"
categories:
  - Gazebo
tag:
  - ROS2
  - Gazebo

#toc: true
---

# World 폴더 구조

```php
my_world/
|-- models/
|   |-- model1/
|   |   |-- model.config
|   |   +-- <model files and folders>
|   |-- model2/
|   |   |-- model.config
|   |   +-- <model files and folders>
|   +-- ...
|-- worlds/
|   |-- my_world.world
|-- materials/
|   +-- ...
+-- my_world.launch
```

- **models/**: 이 폴더에는 Gazebo에서 사용할 모델들이 들어간다. 각 모델 폴더는 model.config 파일을 포함하고 해당 모델의 파일 및 폴더를 가진다.

- **worlds/**: 이 폴더에는 Gazebo 월드의 SDF 파일이 들어간다. **'my_world.world'**와 같은 이름으로 SDF 파일을 생성할 수 있다.

- **materials/**: 이 폴더에는 Gazebo 월드에서 사용할 재질과 텍스처 파일이 들어간다.

- **my_world.launch**: 이 파일은 Gazebo 월드를 로드하고 실행하는 데 사용될 수 있는 ROS 런치 파일이다. ROS를 사용하고 있다면 해당 파일이 필요하며, 사용하지 않는다면 불필요할 수 있다.

### launch 파일이란?
ROS 2에서는 ROS 1과는 다르게 Python 기반의 launch 서비스를 사용하여 런치 파일을 작성한다. ROS 2의 launch 시스템은 기능적으로 더 강력하며, 런치 파일은 Python 스크립트로 작성되어 파라미터 설정, 노드 시작, 조건부 실행 등을 쉽게 구현할 수 있다.




# Model 폴더 구조
기본적으로 Gazebo는 모델을 인식하기 위해 특정한 구조를 요구한다.
일반적으로 모델 폴더는 다음과 같은 구조를 가진다.

```php
~/.gazebo/models/my_model/
├── meshes
│   └── (mesh files, if any)
├── materials
│   └── scripts
│       └── gazebo.material
├── models
│   └── my_model.sdf
└── textures
```

- ```meshes/```: 모델의 메쉬 파일이 있는 폴더. 이 부분은 모델에 메쉬가 포함된 경우에 해당.

- ```materials/```: 모델에 사용되는 재질 정보가 있는 폴더. 일반적으로 gazebo.material 스크립트 파일이 여기에 위치.

- ```models/```: 모델의 SDF 파일이 있는 폴더. SDF 파일은 모델의 구성을 정의.

- ```textures/```: 모델에 사용되는 텍스처 파일이 있는 폴더.

또한 my_model 폴더에 ```model.config``` 파일을 생성해주어야 한다. 해당 파일은 Gazebo가 모델을 인식하고 로드하는 데 도움을 주는 파일이다. 이 파일은 모델의 기본 정보를 정의하고 모델의 이름, 버전 및 SDF 파일의 위치를 제공한다. 해당 파일을 포함하지 않으면 Gazebo가 모델을 올바르게 인식하지 못할 수 있다.

기본적으로 **'model.config'** 파일은 아래의 같은 내용을 갖는다.

```xml
<?xml version="1.0"?>
<model>
  <name>your_model_name</name>
  <version>1.0</version>
  <sdf version="1.7">models/your_model_name.sdf</sdf>
</model>
```