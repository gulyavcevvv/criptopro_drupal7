var isPluginEnabled = false;
var global_selectbox_container = new Array();
var global_isFromCont = new Array();
var global_selectbox_counter = 0;
function getXmlHttp(){
    var xmlhttp;
    try {
        xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
    } catch (e) {
        try {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        } catch (E) {
            xmlhttp = false;
        }
    }
    if (!xmlhttp && typeof XMLHttpRequest!='undefined') {
        xmlhttp = new XMLHttpRequest();
    }
    return xmlhttp;
}

var async_code_included = 0;
var async_Promise;
var async_resolve;
function include_async_code()
{
    if(async_code_included)
    {
        return async_Promise;
    }
    var fileref = document.createElement('script');
    fileref.setAttribute("type", "text/javascript");
    fileref.setAttribute("src", Drupal.settings.criptopro_node.path + "/js/async_code.js");
    document.getElementsByTagName("head")[0].appendChild(fileref);
    async_Promise = new Promise(function(resolve, reject){
        async_resolve = resolve;
    });
    async_code_included = 1;
    return async_Promise;
}

function Common_CheckForPlugIn(idCertListBox) {
    cadesplugin.set_log_level(cadesplugin.LOG_LEVEL_ERROR);
    var canAsync = !!cadesplugin.CreateObjectAsync;
    if(canAsync)
    {
        include_async_code().then(function(){
            return CheckForPlugIn_Async(idCertListBox);
        });
    }else
    {
        return CheckForPlugIn_NPAPI(idCertListBox);
    }
}

function CheckForPlugIn_NPAPI() {
    function VersionCompare_NPAPI(StringVersion, ObjectVersion)
    {
        if(typeof(ObjectVersion) == "string")
            return -1;
        var arr = StringVersion.split('.');

        if(ObjectVersion.MajorVersion == parseInt(arr[0]))
        {
            if(ObjectVersion.MinorVersion == parseInt(arr[1]))
            {
                if(ObjectVersion.BuildVersion == parseInt(arr[2]))
                {
                    return 0;
                }
                else if(ObjectVersion.BuildVersion < parseInt(arr[2]))
                {
                    return -1;
                }
            }else if(ObjectVersion.MinorVersion < parseInt(arr[1]))
            {
                return -1;
            }
        }else if(ObjectVersion.MajorVersion < parseInt(arr[0]))
        {
            return -1;
        }

        return 1;
    }

    function GetCSPVersion_NPAPI() {
        try {
           var oAbout = cadesplugin.CreateObject("CAdESCOM.About");
        } catch (err) {
            alert('Failed to create CAdESCOM.About: ' + cadesplugin.getLastError(err));
            return;
        }
        var ver = oAbout.CSPVersion("", 80);
        return ver.MajorVersion + "." + ver.MinorVersion + "." + ver.BuildVersion;
    }

    function GetCSPName_NPAPI() {
        var sCSPName = "";
        try {
            var oAbout = cadesplugin.CreateObject("CAdESCOM.About");
            sCSPName = oAbout.CSPName(80);

        } catch (err) {
        }
        return sCSPName;
    }

    function ShowCSPVersion_NPAPI(CurrentPluginVersion)
    {
        if(typeof(CurrentPluginVersion) != "string")
        {
            document.getElementById('CSPVersionTxt').innerHTML = "Версия криптопровайдера: " + GetCSPVersion_NPAPI();
        }
        var sCSPName = GetCSPName_NPAPI();
        if(sCSPName!="")
        {
            document.getElementById('CSPNameTxt').innerHTML = "Криптопровайдер: " + sCSPName;
        }
    }
    function GetLatestVersion_NPAPI(CurrentPluginVersion) {
        var xmlhttp = getXmlHttp();
        xmlhttp.open("GET", "https://www.cryptopro.ru/sites/default/files/products/cades/latest_2_0.txt", true);
        xmlhttp.onreadystatechange = function() {
            var PluginBaseVersion;
            if (xmlhttp.readyState == 4) {
                if(xmlhttp.status == 200) {
                    PluginBaseVersion = xmlhttp.responseText;
                    if (isPluginWorked) { // плагин работает, объекты создаются
                        if (VersionCompare_NPAPI(PluginBaseVersion, CurrentPluginVersion)<0) {
                            document.getElementById('PluginEnabledImg').setAttribute("src", "Img/yellow_dot.png");
                            document.getElementById('PlugInEnabledTxt').innerHTML = "Плагин загружен, но есть более свежая версия.";
                        }
                    }
                    else { // плагин не работает, объекты не создаются
                        if (isPluginLoaded) { // плагин загружен
                            if (!isPluginEnabled) { // плагин загружен, но отключен
                                document.getElementById('PluginEnabledImg').setAttribute("src", "Img/red_dot.png");
                                document.getElementById('PlugInEnabledTxt').innerHTML = "Плагин загружен, но отключен в настройках браузера.";
                            }
                            else { // плагин загружен и включен, но объекты не создаются
                                document.getElementById('PluginEnabledImg').setAttribute("src", "Img/red_dot.png");
                                document.getElementById('PlugInEnabledTxt').innerHTML = "Плагин загружен, но не удается создать объекты. Проверьте настройки браузера.";
                            }
                        }
                        else { // плагин не загружен
                            document.getElementById('PluginEnabledImg').setAttribute("src", "Img/red_dot.png");
                            document.getElementById('PlugInEnabledTxt').innerHTML = "Плагин не загружен.";
                        }
                    }
                }
            }
        }
        xmlhttp.send(null);
    }

    function MakeVersionString(oVer)
    {
        var strVer;
        if(typeof(oVer)=="string")
            return oVer;
        else
            return oVer.MajorVersion + "." + oVer.MinorVersion + "." + oVer.BuildVersion;
    }

    var isPluginLoaded = false;
    var isPluginWorked = false;
    var isActualVersion = false;
    try {
        var oAbout = cadesplugin.CreateObject("CAdESCOM.About");
        isPluginLoaded = true;
        isPluginEnabled = true;
        isPluginWorked = true;

        // Это значение будет проверяться сервером при загрузке демо-страницы
        var CurrentPluginVersion = oAbout.PluginVersion;
        if( typeof(CurrentPluginVersion) == "undefined")
            CurrentPluginVersion = oAbout.Version;

        document.getElementById('PluginEnabledImg').setAttribute("src", '/' + Drupal.settings.criptopro_node.path + "/img/green_dot.png");
        document.getElementById('PlugInEnabledTxt').innerHTML = "Плагин загружен.";
        document.getElementById('PlugInVersionTxt').innerHTML = "Версия плагина: " + MakeVersionString(CurrentPluginVersion);
        ShowCSPVersion_NPAPI(CurrentPluginVersion);
    }
    catch (err) {
        // Объект создать не удалось, проверим, установлен ли
        // вообще плагин. Такая возможность есть не во всех браузерах
        var mimetype = navigator.mimeTypes["application/x-cades"];
        if (mimetype) {
            isPluginLoaded = true;
            var plugin = mimetype.enabledPlugin;
            if (plugin) {
                isPluginEnabled = true;
            }
        }
    }
    GetLatestVersion_NPAPI(CurrentPluginVersion);
    FillCertList_NPAPI('CertListBox');
}

function FillCertInfo_NPAPI(certificate, certBoxId, isFromContainer)
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

    var ValidToDate = new Date(certificate.ValidToDate);
    var ValidFromDate = new Date(certificate.ValidFromDate);
    var IsValid = false;
    //если попадется сертификат с неизвестным алгоритмом
    //тут будет исключение. В таком сертификате просто пропускаем такое поле
    try {
        IsValid = certificate.IsValid().Result;    
    } catch (e) {
        
    }
    var hasPrivateKey = certificate.HasPrivateKey();
    var Now = new Date();

    var certObj = new CertificateObj(certificate);
    document.getElementById(BoxId).style.display = '';
    document.getElementById(field_prefix + "subject").innerHTML = "Владелец: <b>" + certObj.GetCertName() + "<b>";
    document.getElementById(field_prefix + "issuer").innerHTML = "Издатель: <b>" + certObj.GetIssuer() + "<b>";
    document.getElementById(field_prefix + "from").innerHTML = "Выдан: <b>" + certObj.GetCertFromDate() + " UTC<b>";
    document.getElementById(field_prefix + "till").innerHTML = "Действителен до: <b>" + certObj.GetCertTillDate() + " UTC<b>";
    if (hasPrivateKey) {
        document.getElementById(field_prefix + "provname").innerHTML = "Криптопровайдер: <b>" + certObj.GetPrivateKeyProviderName() + "<b>";
        try {
            var privateKeyLink = certObj.GetPrivateKeyLink();
            document.getElementById(field_prefix + "privateKeyLink").innerHTML = "Ссылка на закрытый ключ: <b>" + privateKeyLink + "<b>";
        } catch (e) {
            document.getElementById(field_prefix + "privateKeyLink").innerHTML = "Ссылка на закрытый ключ: <b> Набор ключей не существует<b>";    
        }
    } else {
        document.getElementById(field_prefix + "provname").innerHTML = "Криптопровайдер:<b>";
        document.getElementById(field_prefix + "privateKeyLink").innerHTML = "Ссылка на закрытый ключ:<b>";
    }

    document.getElementById(field_prefix + "algorithm").innerHTML = "Алгоритм ключа: <b>" + certObj.GetPubKeyAlgorithm() + "<b>";
    if(Now < ValidFromDate) {
        document.getElementById(field_prefix + "status").innerHTML = "Статус: <span style=\"color:red; font-weight:bold; font-size:16px\"><b>Срок действия не наступил</b></span>";
    } else if( Now > ValidToDate){
        document.getElementById(field_prefix + "status").innerHTML = "Статус: <span style=\"color:red; font-weight:bold; font-size:16px\"><b>Срок действия истек</b></span>";
    } else if( !hasPrivateKey ){
        document.getElementById(field_prefix + "status").innerHTML = "Статус: <span style=\"color:red; font-weight:bold; font-size:16px\"><b>Нет привязки к закрытому ключу</b></span>";
    } else if( !IsValid ){
        document.getElementById(field_prefix + "status").innerHTML = "Статус: <span style=\"color:red; font-weight:bold; font-size:16px\"><b>Ошибка при проверке цепочки сертификатов</b></span>";
    } else {
        document.getElementById(field_prefix + "status").innerHTML = "Статус: <b> Действителен<b>";
    }
    if(isFromContainer)
    {
        document.getElementById(field_prefix + "location").innerHTML = "Установлен в хранилище: <b>Нет</b>";
    } else {
        document.getElementById(field_prefix + "location").innerHTML = "Установлен в хранилище: <b>Да</b>";
    }
}

function MakeCadesBesSign_NPAPI(dataToSign, certObject) {
    var errormes = "";

    try {
        var oSigner = cadesplugin.CreateObject("CAdESCOM.CPSigner");
    } catch (err) {
        errormes = "Failed to create CAdESCOM.CPSigner: " + err.number;
        alert(errormes);
        throw errormes;
    }

    if (oSigner) {
        oSigner.Certificate = certObject;
    }
    else {
        errormes = "Failed to create CAdESCOM.CPSigner";
        alert(errormes);
        throw errormes;
    }

    try {
        var oSignedData = cadesplugin.CreateObject("CAdESCOM.CadesSignedData");
    } catch (err) {
        alert('Failed to create CAdESCOM.CadesSignedData: ' + err.number);
        return;
    }

    var Signature;
    if (dataToSign) {
        // Данные на подпись ввели
        oSignedData.ContentEncoding = 1; //CADESCOM_BASE64_TO_BINARY
        oSignedData.Content = dataToSign;
        oSigner.Options = 1; //CAPICOM_CERTIFICATE_INCLUDE_WHOLE_CHAIN
        try {
            Signature = oSignedData.SignCades(oSigner, cadesplugin.CADESCOM_CADES_BES);
        }
        catch (err) {
            errormes = "Не удалось создать подпись из-за ошибки: " + cadesplugin.getLastError(err);
            alert(cadesplugin.getLastError(err));
            throw errormes;
        }
    }
    return Signature;
}

function CertificateObj(certObj)
{
    this.cert = certObj;
    this.certFromDate = new Date(this.cert.ValidFromDate);
    this.certTillDate = new Date(this.cert.ValidToDate);
}

CertificateObj.prototype.check = function(digit)
{
    return (digit<10) ? "0"+digit : digit;
}

CertificateObj.prototype.checkQuotes = function(str)
{
    var result = 0, i = 0;
    for(i;i<str.length;i++)if(str[i]==='"')
        result++;
    return !(result%2);
}

CertificateObj.prototype.extract = function(from, what)
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

CertificateObj.prototype.DateTimePutTogether = function(certDate)
{
    return this.check(certDate.getUTCDate())+"."+this.check(certDate.getUTCMonth()+1)+"."+certDate.getFullYear() + " " +
                 this.check(certDate.getUTCHours()) + ":" + this.check(certDate.getUTCMinutes()) + ":" + this.check(certDate.getUTCSeconds());
}

CertificateObj.prototype.GetCertString = function()
{
    return this.extract(this.cert.SubjectName,'CN=') + "; Выдан: " + this.GetCertFromDate();
}

CertificateObj.prototype.GetCertFromDate = function()
{
    return this.DateTimePutTogether(this.certFromDate);
}

CertificateObj.prototype.GetCertTillDate = function()
{
    return this.DateTimePutTogether(this.certTillDate);
}

CertificateObj.prototype.GetPubKeyAlgorithm = function()
{
    return this.cert.PublicKey().Algorithm.FriendlyName;
}

CertificateObj.prototype.GetCertName = function()
{
    return this.extract(this.cert.SubjectName, 'CN=');
}

CertificateObj.prototype.GetIssuer = function()
{
    return this.extract(this.cert.IssuerName, 'CN=');
}

CertificateObj.prototype.GetPrivateKeyProviderName = function()
{
    return this.cert.PrivateKey.ProviderName;
}

CertificateObj.prototype.GetPrivateKeyLink = function () {
    return this.cert.PrivateKey.UniqueContainerName;
}

function onCertificateSelected(event) {
    //var selectedCertID = event.target.selectedIndex;
    var selectedCertID = args[0].value;
    var certificate = global_selectbox_container[selectedCertID];
    FillCertInfo_NPAPI(certificate, event.target.boxId, global_isFromCont[selectedCertID]);

    var content = Drupal.settings.criptopro_node.content;
    document.getElementById("SignatureTxtBox").innerHTML = "";

    try
    {
        var signature = MakeCadesBesSign_NPAPI(content, certificate, setDisplayData, TRUE);
        document.getElementById('signature').value = signature;
        Drupal.settings.criptopro_node.signed = true;
        document.getElementById("edit-criptopro-signature-author").disabled = false;
    }
    catch(err)
    {
        document.getElementById("SignatureTxtBox").innerHTML = err;
        document.getElementById("edit-criptopro-signature-author").disabled = true;
        Drupal.settings.criptopro_node.signed = false;
    }


}

function FillCertList_NPAPI(lstId) {
    try {
        var lst = document.getElementById(lstId);
        if(!lst)
            return;
    }
    catch (ex) {
        return;
    }

    lst.onclick = onCertificateSelected;

    lst.boxId = lstId;
    var MyStoreExists = true;

    try {
        var oStore = cadesplugin.CreateObject("CAdESCOM.Store");
        oStore.Open();
    }
    catch (ex) {
        MyStoreExists = false;
    }


    var certCnt;
    if(MyStoreExists) {
        certCnt = oStore.Certificates.Count;
        for (var i = 1; i <= certCnt; i++) {
            var cert;
            try {
                cert = oStore.Certificates.Item(i);
            }
            catch (ex) {
                alert("Ошибка при перечислении сертификатов: " + cadesplugin.getLastError(ex));
                return;
            }

            var oOpt = document.createElement("OPTION");
            try {
                    var certObj = new CertificateObj(cert, true);
                    oOpt.text = certObj.GetCertString();
            }
            catch (ex) {
                alert("Ошибка при получении свойства SubjectName: " + cadesplugin.getLastError(ex));
            }
            try {
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

        oStore.Close();
    }

    //В версии плагина 2.0.13292+ есть возможность получить сертификаты из 
    //закрытых ключей и не установленных в хранилище
    try {
        oStore.Open(cadesplugin.CADESCOM_CONTAINER_STORE);
        certCnt = oStore.Certificates.Count;
        for (var i = 1; i <= certCnt; i++) {
            var cert = oStore.Certificates.Item(i);
            //Проверяем не добавляли ли мы такой сертификат уже?
            var found = false;
            for (var j = 0; j < global_selectbox_container.length; j++)
            {
                if (global_selectbox_container[j].Thumbprint === cert.Thumbprint)
                {
                    found = true;
                    break;
                }
            }
            if(found)
                continue;
            var certObj = new CertificateObj(cert);
            var oOpt = document.createElement("OPTION");
            oOpt.text = certObj.GetCertString();
            oOpt.value = global_selectbox_counter
            global_selectbox_container.push(cert);
            global_isFromCont.push(true);
            global_selectbox_counter++;
            lst.options.add(oOpt);
        }
        oStore.Close();
    }
    catch (ex) {
    }
    if(global_selectbox_container.length == 0) {
        document.getElementById("boxdiv").style.display = '';
    }
}

function isIE() {
    var retVal = (("Microsoft Internet Explorer" == navigator.appName) || // IE < 11
        navigator.userAgent.match(/Trident\/./i)); // IE 11
    return retVal;
}

function isEdge() {
    var retVal = navigator.userAgent.match(/Edge\/./i);
    return retVal;
}

function ShowEdgeNotSupported() {
    document.getElementById('PluginEnabledImg').setAttribute("src", "Img/red_dot.png");
    document.getElementById('PlugInEnabledTxt').innerHTML = "К сожалению, браузер Edge не поддерживается!";
}

//-----------------------------------
var Base64 = {


    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",


    encode: function(input) {
            var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                    enc4 = 64;
            }

            output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },


    decode: function(input) {
            var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
            }

        }

        output = Base64._utf8_decode(output);

        return output;

    },

    _utf8_encode: function(string) {
            string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                    utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    _utf8_decode: function(utftext) {
            var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while (i < utftext.length) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                    string += String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                    c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }

}

