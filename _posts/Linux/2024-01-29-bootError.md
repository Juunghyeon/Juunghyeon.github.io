---
layout: single
title: "[Linux] Boot Error"
# excerpt: ""
categories:
  - Linux
tag:
  - Linux

toc: false
---

## 문제상황
리눅스 설치 후 무한부팅 문제가 발생. 아무리 기다려봐도 리눅스 화면이 나오지 않음.

## 문제원인
그래픽 드라이버 버전의 문제. 그래픽 드라이버와 컴퓨터 그래픽이 서로 맞지 않아 생긴 문제로 추측됨.
```linux
jh@jh-H110M-DS2V:~$ lspci | grep -i vga
01:00.0 VGA compatible controller: NVIDIA Corporation TU106[GeForce RTX 2070 Rev. A] (rev a1)
```

```linux
jh@jh-H110M-DS2V:~$ ubuntu-drivers devices
== /sys/devices/pci0000:00/0000:00:01.0/0000:01:00.0 ==
modalias : pci:v000010DEd00001F07sv00001043sd00008671bc03sc00i00
vendor   : NVIDIA Corporation
model    : TU106 [GeForce RTX 2070 Rev. A]
driver   : nvidia-driver-535-open - distro non-free
driver   : nvidia-driver-535-server - distro non-free
driver   : nvidia-driver-470-server - distro non-free
driver   : nvidia-driver-418-server - distro non-free
driver   : nvidia-driver-535 - distro non-free
driver   : nvidia-driver-470 - distro non-free
driver   : nvidia-driver-450-server - distro non-free
driver   : nvidia-driver-525 - distro non-free
driver   : nvidia-driver-525-open - distro non-free
driver   : nvidia-driver-525-server - distro non-free
driver   : nvidia-driver-535-server-open - distro non-free recommended
driver   : xserver-xorg-video-nouveau - distro free builtin
```

recommand 인 'nvidia-driver-535-server-open' 로 설치하니 역시 무한부팅 문제가 발생했다. 'nvidia-driver-525-open' 역시 같은 문제가 발생하였고 최종적으로 **'nvidia-driver-470'**로 설치하니 드디어 해결되었다.


## 해결방법
1. **Advanced options for Ubuntu 를 선택한다.**
![image](https://github.com/Juunghyeon/test/assets/78840944/36211bac-1340-4e40-8f5a-c17091a728b1)

2. **recovery mode 선택**
![image](https://github.com/Juunghyeon/test/assets/78840944/42e82278-3897-4c75-b3c1-ab2a1c621188)

3. **root 선택**
![image](https://github.com/Juunghyeon/test/assets/78840944/c412cf00-ee99-4c97-a266-009145819622)

4. **명령어 입력**
```linux
sudo apt-get purge nvidia*
```
해당 명령어는 nvidia 그래픽 드라이버를 날려버리는 명령이다.
드라이버는 부팅 이후에 다시 설치하면 된다.
5. **재부팅**
재부팅을 하니 부팅이 되었다.

## Reference
<https://tes-b.github.io/ubuntu/Ubuntu-boot-fail/>