Модуль использования криптопро в drupal7
=====================

## Установка

### Сборка расширения для php на centos

Начальная настройка
```
yum update -y
yum install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
yum install -y http://rpms.remirepo.net/enterprise/remi-release-7.rpm
yum install -y yum-utils
```

Установка php 5.6 и других папетов
```
yum-config-manager --enable remi-php56
yum install -y wget php php-devel php-mcrypt php-cli php-gd php-curl php-mysql php-ldap php-xml php-zip php-fileinfo boost-devel lsb gcc-c++
```

cades_linux_amd64.tar.gz скачивается https://www.cryptopro.ru/products/cades/downloads
linux-amd64_deb.tgz скачивается https://www.cryptopro.ru/products/csp/downloads
Эти два файла положить в root
```
cd /root
tar -xf ./cades_linux_amd64.tar.gz
tar -xf ./linux-amd64.tgz
```

Установка КриптоПро CSP (номер сборки посмотреть в папке /root/linux-amd64)
```
cd /root/linux-amd64 && ./install.sh
yum install -y cprocsp-rdr-gui-gtk-64-45.0.11455-5.x86_64.rpm
```

Установка КриптоПро ЭЦП SDK
```
cd /root/cades_linux_amd64
rpm -i --nodeps lsb-cprocsp-devel-5.0.11438-4.noarch.rpm
yum install -y cprocsp-pki-2.0.0-amd64-cades.rpm cprocsp-pki-2.0.0-amd64-phpcades.rpm
```

Сборка расширения PHP libphpcades.so
```
#Создание симлинка вместо редактирования Makefile
ln -s /usr/include/php-zts/php /php
cd /opt/cprocsp/src/phpcades/ && eval `/opt/cprocsp/src/doxygen/CSP/../setenv.sh --64`; make -f Makefile.unix
```

Установка расширения в PHP
```
ln /opt/cprocsp/src/phpcades/libphpcades.so /usr/lib64/php/modules/libphpcades.so
echo "extension=libphpcades.so" > /etc/php.d/libphpcades.ini
```


### Установка корневого сертификата криптопро

Скачать и установить
```
cd /root/
wget http://cpca.cryptopro.ru/cacer.p7b
/opt/cprocsp/bin/amd64/certmgr -inst -store mroot -file /root/cacer.p7b
```

Проверить установку сертификатов можно командой
```
/opt/cprocsp/bin/amd64/certmgr -list -store root
```

### Можно установить тестовый корневой сертификат
Скачать и установить
```
cd /root/
wget -O certnew.cer "https://www.cryptopro.ru/certsrv/certnew.cer?ReqID=CACert&Renewal=1&Enc=bin"
/opt/cprocsp/bin/amd64/certmgr -inst -store mroot -file /root/certnew.cer
```

Удалить тестовый корневой сертификат можно командой
```
/opt/cprocsp/bin/amd64/certmgr -delete -store mroot -dn "CN=CRYPTO-PRO Test Center 2"
```

### Лицензии КриптоПро CSP

Проверить лицензию
```
 /opt/cprocsp/sbin/amd64/cpconfig -license -view
```

Установить лицензии
```
 /opt/cprocsp/sbin/amd64/cpconfig -license -set <лицензия>
```

### Настройка apache
Возможно потребуется:

1. Чтобы запустить libphpcades (который компилируется как NTS) необходимо переключить настройку php:
/etc/httpd/conf.modules.d/00-mpm.conf - закомментировать mod_mpm_worker.so и раскомментировать mod_mpm_prefork.so

2. Так же может требуется отключить защиту SELinux
https://blog.sedicomm.com/2017/08/02/kak-vremenno-ili-navsegda-otklyuchit-selinux-v-rhel-centos-7-6/


## Использование

1. После включения модуля
2. Перейти в редактирование нужного типа метериалла
3. Во вкладке "criptopro" указать нужные настройки
4. В управлении отображением типа материала настраиваем положение новых псевдополей (в зависимости от настроек двух или трех)
5. В форме редактирования материала, в зависимости от настроек и пользователя, появится кнопка "подписать".
6. Переходим по данной кнопке в форму выбора личного сертификата. Должен быть установлен КриптоПро ЭЦП Browser plug-in.
7. Выбрать личный сертификат и нажать кнопку "подписать"
8. В просмотре ноды проверяем свойства подписи.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details