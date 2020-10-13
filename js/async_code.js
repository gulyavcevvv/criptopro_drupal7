function CertificateAdjuster()
{
}
CertificateAdjuster.prototype.checkQuotes = function(str)
{
    var result = 0, i = 0;
    for(i;i<str.length;i++)if(str[i]==='"')
        result++;
    return !(result%2);
}

CertificateAdjuster.prototype.extract = function(from, what)
{
    certName = "";

    var begin = from.indexOf(what);

    if(begin>=0)
    {
        var end = from.indexOf(', ', begin);
        while(end > 0) {
            if (this.checkQuotes(from.substr(begin, end-begin)))
                break;
            end = from.indexOf(', ', end + 1);
        }
        certName = (end < 0) ? from.substr(begin) : from.substr(begin, end - begin);
    }

    return certName;
}

CertificateAdjuster.prototype.Print2Digit = function(digit)
{
    return (digit<10) ? "0"+digit : digit;
}

CertificateAdjuster.prototype.GetCertDate = function(paramDate)
{
    var certDate = new Date(paramDate);
    return this.Print2Digit(certDate.getUTCDate())+"."+this.Print2Digit(certDate.getUTCMonth()+1)+"."+certDate.getFullYear() + " " +
             this.Print2Digit(certDate.getUTCHours()) + ":" + this.Print2Digit(certDate.getUTCMinutes()) + ":" + this.Print2Digit(certDate.getUTCSeconds());
}

CertificateAdjuster.prototype.GetCertName = function(certSubjectName)
{
    return this.extract(certSubjectName, 'CN=');
}

CertificateAdjuster.prototype.GetIssuer = function(certIssuerName)
{
    return this.extract(certIssuerName, 'CN=');
}

CertificateAdjuster.prototype.GetCertInfoString = function(certSubjectName, certFromDate)
{
    return this.extract(certSubjectName,'CN=') + "; Выдан: " + this.GetCertDate(certFromDate);
}

function CheckForPlugIn_Async(idCertListBox) {
    function VersionCompare_Async(StringVersion, ObjectVersion)
    {
        if(typeof(ObjectVersion) == "string")
            return -1;
        var arr = StringVersion.split('.');
        var isActualVersion = true;

        cadesplugin.async_spawn(function *() {
            if((yield ObjectVersion.MajorVersion) == parseInt(arr[0]))
            {
                if((yield ObjectVersion.MinorVersion) == parseInt(arr[1]))
                {
                    if((yield ObjectVersion.BuildVersion) == parseInt(arr[2]))
                    {
                        isActualVersion = true;
                    }
                    else if((yield ObjectVersion.BuildVersion) < parseInt(arr[2]))
                    {
                        isActualVersion = false;
                    }
                }else if((yield ObjectVersion.MinorVersion) < parseInt(arr[1]))
                {
                    isActualVersion = false;
                }
            }else if((yield ObjectVersion.MajorVersion) < parseInt(arr[0]))
            {
                isActualVersion = false;
            }

            if(!isActualVersion)
            {
                document.getElementById('PluginEnabledImg').setAttribute("src", "Img/yellow_dot.png");
                document.getElementById('PlugInEnabledTxt').innerHTML = "Плагин загружен, но есть более свежая версия.";
            }
            document.getElementById('PlugInVersionTxt').innerHTML = "Версия плагина: " + (yield CurrentPluginVersion.toString());
            var oAbout = yield cadesplugin.CreateObjectAsync("CAdESCOM.About");
            var ver = yield oAbout.CSPVersion("", 80);
            var ret = (yield ver.MajorVersion) + "." + (yield ver.MinorVersion) + "." + (yield ver.BuildVersion);
            document.getElementById('CSPVersionTxt').innerHTML = "Версия криптопровайдера: " + ret;

            try
            {
                var sCSPName = yield oAbout.CSPName(80);
                document.getElementById('CSPNameTxt').innerHTML = "Криптопровайдер: " + sCSPName;
            }
            catch(err){}
            return;
        });
    }

    function GetLatestVersion_Async(CurrentPluginVersion) {
        var xmlhttp = getXmlHttp();
        xmlhttp.open("GET", "https://www.cryptopro.ru/sites/default/files/products/cades/latest_2_0.txt", true);
        xmlhttp.onreadystatechange = function() {
        var PluginBaseVersion;
            if (xmlhttp.readyState == 4) {
                if(xmlhttp.status == 200) {
                    PluginBaseVersion = xmlhttp.responseText;
                    VersionCompare_Async(PluginBaseVersion, CurrentPluginVersion)
                }
            }
        }
        xmlhttp.send(null);
    }

    document.getElementById('PluginEnabledImg').setAttribute("src", '/' + Drupal.settings.criptopro_node.path + "/img/green_dot.png");
    document.getElementById('PlugInEnabledTxt').innerHTML = "Плагин загружен.";
    var CurrentPluginVersion;
    cadesplugin.async_spawn(function *() {
        var oAbout = yield cadesplugin.CreateObjectAsync("CAdESCOM.About");
        CurrentPluginVersion = yield oAbout.PluginVersion;
        GetLatestVersion_Async(CurrentPluginVersion);
        FillCertList_Async(idCertListBox);
    }); //cadesplugin.async_spawn
}

function onCertificateSelected(event) {
    cadesplugin.async_spawn(function *(args) {
        var selectedCertID = args[0].value;
        var certificate = global_selectbox_container[selectedCertID];
        FillCertInfo_Async(certificate, event.target.boxId, global_isFromCont[selectedCertID]);
        var content = Drupal.settings.criptopro_node.content;

        document.getElementById("SignatureTxtBox").innerHTML = "";
        SignCades_Async(certificate, content).then(
            function(signedMessage){
                document.getElementById('signature').value = signedMessage;
                Drupal.settings.criptopro_node.signed = true;
                document.getElementById("edit-criptopro-signature-author").disabled = false;
            },
            function(signedMessage){
                document.getElementById("SignatureTxtBox").innerHTML = signedMessage;
                Drupal.settings.criptopro_node.signed = false;
                document.getElementById("edit-criptopro-signature-author").disabled = true;
            }
        );

    }, event.target);
}

function FillCertList_Async(lstId) {
    cadesplugin.async_spawn(function *() {
        var MyStoreExists = true;
        try {
            var oStore = yield cadesplugin.CreateObjectAsync("CAdESCOM.Store");
            if (!oStore) {
                alert("Create store failed");
                return;
            }

            yield oStore.Open();
        }
        catch (ex) {
            MyStoreExists = false;
        }

        var lst = document.getElementById(lstId);
        if(!lst)
        {
            return;
        }
        lst.onclick = onCertificateSelected;
        lst.boxId = lstId;

        var certCnt;
        var certs;
        if (MyStoreExists) {
            try {
                certs = yield oStore.Certificates;
                certCnt = yield certs.Count;
            }
            catch (ex) {
                alert("Ошибка при получении Certificates или Count: " + cadesplugin.getLastError(ex));
                return;
            }
            for (var i = 1; i <= certCnt; i++) {
                var cert;
                try {
                    cert = yield certs.Item(i);
                }
                catch (ex) {
                    alert("Ошибка при перечислении сертификатов: " + cadesplugin.getLastError(ex));
                    return;
                }

                var oOpt = document.createElement("OPTION");
                var dateObj = new Date();
                try {
                    var ValidFromDate = new Date((yield cert.ValidFromDate));
                    oOpt.text = new CertificateAdjuster().GetCertInfoString(yield cert.SubjectName, ValidFromDate);
                }
                catch (ex) {
                    alert("Ошибка при получении свойства SubjectName: " + cadesplugin.getLastError(ex));
                }
                try {
                    //oOpt.value = yield cert.Thumbprint;
                    oOpt.value = global_selectbox_counter
                    global_selectbox_container.push(cert);
                    global_isFromCont.push(false);
                    global_selectbox_counter++;
                }
                catch (ex) {
                    alert("Ошибка при получении свойства Thumbprint: " + cadesplugin.getLastError(ex));
                }

                lst.options.add(oOpt);
            }

            yield oStore.Close();
        }

        //В версии плагина 2.0.13292+ есть возможность получить сертификаты из 
        //закрытых ключей и не установленных в хранилище
        try {
            yield oStore.Open(cadesplugin.CADESCOM_CONTAINER_STORE);
            certs = yield oStore.Certificates;
            certCnt = yield certs.Count;
            for (var i = 1; i <= certCnt; i++) {
                var cert = yield certs.Item(i);
                //Проверяем не добавляли ли мы такой сертификат уже?
                var found = false;
                for (var j = 0; j < global_selectbox_container.length; j++)
                {
                    if ((yield global_selectbox_container[j].Thumbprint) === (yield cert.Thumbprint))
                    {
                        found = true;
                        break;
                    }
                }
                if(found)
                    continue;
                var oOpt = document.createElement("OPTION");
                var ValidFromDate = new Date((yield cert.ValidFromDate));
                oOpt.text = new CertificateAdjuster().GetCertInfoString(yield cert.SubjectName, ValidFromDate);
                oOpt.value = global_selectbox_counter;
                global_selectbox_container.push(cert);
                global_isFromCont.push(true);
                global_selectbox_counter++;
                lst.options.add(oOpt);
            }
            yield oStore.Close();

        }
        catch (ex) {
        }
    });//cadesplugin.async_spawn
}

function SignCades_Async(certificate, data) {
    return new Promise(function(resolve, reject){

        cadesplugin.async_spawn(function*(arg) {

            var certificate = arg[0];
            var dataToSign = arg[1];
    
            var Signature;
            try
            {
                var errormes = "";
                try {
                    var oSigner = yield cadesplugin.CreateObjectAsync("CAdESCOM.CPSigner");
                } catch (err) {
                    errormes = "Failed to create CAdESCOM.CPSigner: " + err.number;
                    throw errormes;
                }
                var oSigningTimeAttr = yield cadesplugin.CreateObjectAsync("CADESCOM.CPAttribute");
    
                yield oSigningTimeAttr.propset_Name(cadesplugin.CAPICOM_AUTHENTICATED_ATTRIBUTE_SIGNING_TIME);
                var oTimeNow = new Date();
                yield oSigningTimeAttr.propset_Value(oTimeNow);
                var attr = yield oSigner.AuthenticatedAttributes2;
                yield attr.Add(oSigningTimeAttr);
    
    
                //var oDocumentNameAttr = yield cadesplugin.CreateObjectAsync("CADESCOM.CPAttribute");
                //yield oDocumentNameAttr.propset_Name(cadesplugin.CADESCOM_AUTHENTICATED_ATTRIBUTE_DOCUMENT_NAME);
                //yield oDocumentNameAttr.propset_Value("Document Name");
                //yield attr.Add(oDocumentNameAttr);
    
                if (oSigner) {
                    yield oSigner.propset_Certificate(certificate);
                }
                else {
                    errormes = "Failed to create CAdESCOM.CPSigner";
                    throw errormes;
                }
    
                var oSignedData = yield cadesplugin.CreateObjectAsync("CAdESCOM.CadesSignedData");
                if (dataToSign) {
                    // Данные на подпись ввели
                    yield oSigner.propset_Options(cadesplugin.CAPICOM_CERTIFICATE_INCLUDE_WHOLE_CHAIN);
                    yield oSignedData.propset_ContentEncoding(cadesplugin.CADESCOM_BASE64_TO_BINARY); //
                    yield oSignedData.propset_Content(dataToSign);
    
                    try {
                        Signature = yield oSignedData.SignCades(oSigner, cadesplugin.CADESCOM_CADES_BES);
                    }
                    catch (err) {
                        errormes = "Не удалось создать подпись из-за ошибки: " + cadesplugin.getLastError(err);
                        throw errormes;
                    }
                }
                arg[2](Signature);
            }
            catch(err)
            {
                //SignatureFieldTitle[0].innerHTML = "Возникла ошибка:";
                //document.getElementById("SignatureTxtBox").innerHTML = err;
                arg[3](err);
            }
        }, certificate, data, resolve, reject); //cadesplugin.async_spawn
    });

    
}

function FillCertInfo_Async(certificate, certBoxId, isFromContainer)
{
    var BoxId;
    var field_prefix;
    if(typeof(certBoxId) == 'undefined' || certBoxId == "CertListBox")
    {
        BoxId = 'cert_info';
        field_prefix = '';
    }else if (certBoxId == "CertListBox1") {
        BoxId = 'cert_info1';
        field_prefix = 'cert_info1';
    } else if (certBoxId == "CertListBox2") {
        BoxId = 'cert_info2';
        field_prefix = 'cert_info2';
    } else {
        BoxId = certBoxId;
        field_prefix = certBoxId;
    }
    cadesplugin.async_spawn (function*(args) {
        var Adjust = new CertificateAdjuster();

        var ValidToDate = new Date((yield args[0].ValidToDate));
        var ValidFromDate = new Date((yield args[0].ValidFromDate));
        var Validator;
        var IsValid = false;
        //если попадется сертификат с неизвестным алгоритмом
        //тут будет исключение. В таком сертификате просто пропускаем такое поле
        try {
            Validator = yield args[0].IsValid();
            IsValid = yield Validator.Result;
        } catch(e) {

        }
        var hasPrivateKey = yield args[0].HasPrivateKey();
        var Now = new Date();

        document.getElementById(args[1]).style.display = '';
        document.getElementById(args[2] + "subject").innerHTML = "Владелец: <b>" + Adjust.GetCertName(yield args[0].SubjectName) + "<b>";
        document.getElementById(args[2] + "issuer").innerHTML = "Издатель: <b>" + Adjust.GetIssuer(yield args[0].IssuerName) + "<b>";
        document.getElementById(args[2] + "from").innerHTML = "Выдан: <b>" + Adjust.GetCertDate(ValidFromDate) + " UTC<b>";
        document.getElementById(args[2] + "till").innerHTML = "Действителен до: <b>" + Adjust.GetCertDate(ValidToDate) + " UTC<b>";
        var pubKey = yield args[0].PublicKey();
        var algo = yield pubKey.Algorithm;
        var fAlgoName = yield algo.FriendlyName;
        document.getElementById(args[2] + "algorithm").innerHTML = "Алгоритм ключа: <b>" + fAlgoName + "<b>";
        if (hasPrivateKey) {
            var oPrivateKey = yield args[0].PrivateKey;
            var sProviderName = yield oPrivateKey.ProviderName;
            document.getElementById(args[2] + "provname").innerHTML = "Криптопровайдер: <b>" + sProviderName + "<b>";
            try {
                var sPrivateKeyLink = yield oPrivateKey.UniqueContainerName;
                document.getElementById(args[2] + "privateKeyLink").innerHTML = "Ссылка на закрытый ключ: <b>" + sPrivateKeyLink + "<b>";
            } catch (e) {
                document.getElementById(args[2] + "privateKeyLink").innerHTML = "Ссылка на закрытый ключ: <b>" + e.message + "<b>";
            }
        } else {
            document.getElementById(args[2] + "provname").innerHTML = "Криптопровайдер:<b>";
            document.getElementById(args[2] + "privateKeyLink").innerHTML = "Ссылка на закрытый ключ:<b>";
        }
        if(Now < ValidFromDate) {
            document.getElementById(args[2] + "status").innerHTML = "Статус: <span style=\"color:red; font-weight:bold; font-size:16px\"><b>Срок действия не наступил</b></span>";
        } else if( Now > ValidToDate){
            document.getElementById(args[2] + "status").innerHTML = "Статус: <span style=\"color:red; font-weight:bold; font-size:16px\"><b>Срок действия истек</b></span>";
        } else if( !hasPrivateKey ){
            document.getElementById(args[2] + "status").innerHTML = "Статус: <span style=\"color:red; font-weight:bold; font-size:16px\"><b>Нет привязки к закрытому ключу</b></span>";
        } else if( !IsValid ){
            document.getElementById(args[2] + "status").innerHTML = "Статус: <span style=\"color:red; font-weight:bold; font-size:16px\"><b>Ошибка при проверке цепочки сертификатов</b></span>";         
        } else {
            document.getElementById(args[2] + "status").innerHTML = "Статус: <b> Действителен<b>";
        }

        if(args[3])
        {
            document.getElementById(field_prefix + "location").innerHTML = "Установлен в хранилище: <b>Нет</b>";            
        } else {
            document.getElementById(field_prefix + "location").innerHTML = "Установлен в хранилище: <b>Да</b>";
        }

    }, certificate, BoxId, field_prefix, isFromContainer);//cadesplugin.async_spawn
}

function isIE() {
    var retVal = (("Microsoft Internet Explorer" == navigator.appName) || // IE < 11
        navigator.userAgent.match(/Trident\/./i)); // IE 11
    return retVal;
}

async_resolve();
