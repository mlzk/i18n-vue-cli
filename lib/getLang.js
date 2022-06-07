const fs = require('fs')
const path = require('path')
const os = require('os')
const filePath = path.resolve('./src')
const readline = require('readline')
let test = /[\u4E00-\u9FA5\uF900-\uFA2D]+[\u4E00-\u9FA5\uF900-\uFA2D\uff01\uff08-\uff1f\u3001-\u3015\u0020a-zA-Z\d\\\/+*/-]*/
let rl = null
let lang = {}
let isNote = false
let dirU = os.type().toLowerCase().includes('window') ? '\\' : '/' // window环境使用‘\\’mac系统使用‘/’
const translate = require("baidu-translate-api");

function getFileList(dir, pages, filesList = [], ignoredir) {
    const files = fs.readdirSync(dir)
    files.forEach((item, index) => {
        if (ignoredir && ignoredir.includes(item)) return
        let fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) {
            return getFileList(fullPath, pages, filesList, ignoredir) // 递归读取文件
        } else {
            filesList.push(fullPath)
        }
    })
    return filesList
}

function readFileList(dir, pages, ignoredir, fileKey) {
    // return new Promise((resolve, reject) => {
    let filesList = []
    let ps = []
    getFileList(dir, pages, filesList, ignoredir)
    filesList.forEach((fullPath) => {
        let p = null
        let path2 = fullPath.replace(process.cwd() + dirU + 'src' + dirU, '')
        if (pages.some(pagedir => path2.includes(pagedir))) {
            pages.some(pagedir => {
                if (path2.includes(pagedir)) {
                    path2 = path2.replace(pagedir + dirU, '')
                    return true
                }
                return false
            })
            let key = path2.substr(0, path2.indexOf(dirU))
            let extname = path.extname(fullPath)
            if (['.vue', '.js'].includes(extname)) {
                p = new Promise((resolve, reject) => {
                    isNote = false
                    rl = readline.createInterface({
                        input: fs.createReadStream(fullPath)
                    })
                    let lineIndex = 0
                    rl.on('line', (line) => {
                        lineIndex++
                        let content = isNote ? '' : line
                        if (line.includes('/*')) {
                            isNote = true
                            content = line.slice(0, line.indexOf('/*'))
                        }
                        if (line.includes('*/')) {
                            if (isNote) {
                                isNote = false
                                content = line.slice(line.indexOf('*/') + 2)
                            }
                        }
                        if (line.includes('<!--')) {
                            isNote = true
                            content = line.slice(0, line.indexOf('<!--'))
                        }
                        if (line.includes('-->')) {
                            if (isNote) {
                                isNote = false
                                content = line.slice(line.indexOf('-->') + 3)
                            }
                        }
                        if (isNote && !content) return
                        if (line.includes('//')) content = line.slice(0, line.indexOf('//'))

                        let str = content.match(test)
                        while (str) {
                            if (str) {
                                str = str[0]
                                let otherStr = ''
                                if (content.indexOf('\'' + str) > -1) {
                                    let contentArr = content.split(str)
                                    otherStr = contentArr[1] ? contentArr[1].slice(0, contentArr[1].indexOf('\'')) : ''
                                }
                                if (content.indexOf('"' + str) > -1) {
                                    let contentArr = content.split(str)
                                    otherStr = contentArr[1] ? contentArr[1].slice(0, contentArr[1].indexOf('"')) : ''
                                }

                                if (content.indexOf('>' + str) > -1) {
                                    let contentArr = content.split(str)
                                    otherStr = contentArr[1] ? contentArr[1].slice(0, contentArr[1].indexOf('<')) : ''
                                }
                                if (content.indexOf('}}' + str) > -1) {

                                    let contentArr = content.split(str)
                                    otherStr = contentArr[1] ? contentArr[1].slice(0, contentArr[1].indexOf('}}')) : ''
                                }

                                if (content.indexOf(str + '{{') > -1) {
                                    let contentArr = content.split(str)
                                    otherStr = contentArr[1] ? contentArr[1].slice(0, contentArr[1].indexOf('{{')) : ''
                                }
                                if (content.indexOf(str + '"') > -1) {
                                    let contentArr = content.split(str)
                                    let reverseStr = contentArr[0].split("").reverse()
                                    str = reverseStr.splice(0, reverseStr.indexOf('"')).reverse().join("") + str
                                } else {
                                    str += otherStr // .replace(/{{(.*)}}/g, '')
                                }
                                if (lang[key]) {
                                    lang[key].push(str)
                                } else {
                                    lang[key] = [str]
                                }
                            }
                            content = content.slice(0, content.indexOf(str)) + content.slice(content.indexOf(str) + str.length)
                            str = content.match(test)
                        }
                    })
                    rl.on('close', () => {
                        resolve(lang)
                    })
                })
                ps.push(p)
            }
        }
    })
    return Promise.all(ps)
    // })
}
async function translateToEn(str) {
    // The text to translate
    console.log(str)
    let res = await translate(str)
    let rstr = res.trans_result.dst
    let patt = /\\u\\/g;
    let result = rstr.match(patt);
    if (result && result.length > 0) {
        rstr = rstr.replace(/\\u\\/g, `___`);
    }

    let patt2 = /\\\u/g;
    let result2 = rstr.match(patt2);
    if (result2 && result2.length > 0) {
        rstr = rstr.replace(/\\\u/g, `___`);
    }

    console.log(rstr)
    let data = rstr.split('___')
    console.log('过滤前')

    // let resData = []
    // try {
    //     // 百度翻译会吞掉括号后的引号
    //     // if (data.indexOf('),') > -1) {
    //     //     console.log(true)
    //     //     // console.log(data)
    //     //     data = data.replace(/\)\,/g, `)", `);
    //     //     // data.replace(new RegExp('/\),\/','gm'),`)", "`)
    //     //     // console.log(data)

    //     // }
    //     let patt = /[^\b"],/g;
    //     let result = data.match(patt);
    //     console.log(result)
    //     if (result && result.length > 0) {
    //         for (let i = 0; i < result.length; i++) {
    //             let resText = result[i].split(',').join('"') + ',"'
    //             console.log(result[i] + '"', resText)
    //             data = data.replace(result[i] + ' "', resText);
    //             data = data.replace(result[i] + '"', resText);
    //         }
    //     }
    //     console.log('2过滤')
    //     let patt2 = /\\/g;
    //     let result2 = data.match(patt2);
    //     console.log(result2)
    //     if (result2 && result2.length > 0) {
    //         data.replace(/\\/g, `#`);
    //     }

    //     // if () {

    //     // }
    //     console.log('过滤后')
    //     console.log(data)
    //     resData = JSON.parse(data)
    // } catch (err) {
    //     console.error(err)
    // }
    return data
}

function cutArray(array, subLength) {
    let index = 0;
    let newArr = [];
    while (index < array.length) {
        newArr.push(array.slice(index, index += subLength));
    }
    console.log(newArr)
    return newArr;
}

async function handleGroupAsync(str) {
    // 分割分次翻译 翻译文本长度有最大字节限制
    console.log('开始请求百度接口尝试翻译文件...')
    let divArr = str
    let res = []
    if (str && str.length > 100) {
        divArr = cutArray(str, 100)
        console.log('文本过长，已分割为', divArr.length, '段请求')
        for (let i = 0; i < divArr.length; i++) {
            let re = await translateToEn((divArr[i]).join("___"))
            res = res.concat(re)
        }
    } else {

        res = await translateToEn((divArr).join("___"))
    }
    return res
}
async function inputLangs(fileName, fileKey) {
    let item

    let cs_Lang = {
        cs_common: {}
    }
    let allObj = {}
    for (item in lang) {
        let arr = lang[item]
        for (let val of arr) {
            if (allObj[val]) {
                allObj[val] = 2
            } else {
                allObj[val] = 1
            }
        }
    }
    let otherObjs = {}

    // 提取公共
    let count = 0
    for (let val in allObj) {
        if (allObj[val] === 2) {
            count++
            cs_Lang['cs_common'][val] = val
            otherObjs[val] = true
        } else {}
    }
    // console.log(lang)
    // console.log(cs_Lang['cs_common'])
    for (item in lang) {
        let arr = lang[item]
        if (!cs_Lang[`cs_${item}`]) {
            count = 0
            cs_Lang[`cs_${item}`] = {}
        } else {
            count = cs_Lang[`cs_${item}`].length
        }
        for (let val of arr) {
            if (!otherObjs[val]) {
                count++
                cs_Lang[`cs_${item}`][val] = val
            } else {}
        }
    }
    console.log('----------------------------------------------------\n')
    let cs_lang_files = {}

    // cs_lang_files[fileKey] = { ...cs_Lang.cs_common, ...cs_Lang.cs_view }

    cs_lang_files[fileKey] = {}


    Object.keys(cs_Lang).forEach((key) => {
        cs_lang_files[fileKey] = { ...cs_lang_files[fileKey], ...cs_Lang[key] }
    })
    let str = JSON.stringify(cs_Lang).replace(/\"/g, '\'')
    let res = 'export default ' + JSON.stringify(cs_lang_files).replace(/\"/g, '\'')
    fs.writeFile(fileName, str, function(error) {
        if (error) {
            console.log(error)
        } else {
            console.log('collect lang finish!')
        }
    })
    const ZhFilePath = 'src/locale/lang/zh_CN/' + fileKey + '.js'
    console.log('开始写入中文翻译文件', ZhFilePath)
    fs.writeFile(ZhFilePath, res, function(error) {
        if (error) {
            console.log(error)
        } else {
            console.log('collect lang finish!')
        }
    })

    const postTransText = []
    Object.keys(cs_lang_files[fileKey]).forEach((key, index) => {
        postTransText.push(cs_lang_files[fileKey][key])
    })
    // let resEn = await translateToEn(JSON.stringify(postTransText))
    //  const resEnArr = JSON.parse(resEn)
    let resEn = await handleGroupAsync(postTransText)
    const resEnArr = resEn
    let enObject = cs_lang_files[fileKey]
    Object.keys(enObject).forEach((key, index) => {
        enObject[key] = resEnArr[index]
        console.log(key, resEnArr[index])
    })
    const en_res = {}
    en_res[fileKey] = enObject
    const en_res_files = 'export default ' + JSON.stringify(en_res).replace(/\"/g, '\'')
    const EnFilePath = 'src/locale/lang/en_US/' + fileKey + '.js'
    console.log('开始写入英文翻译文件', EnFilePath)

    fs.writeFile(EnFilePath, en_res_files, function(error) {
        if (error) {
            console.log(error)
        } else {
            console.log('collect lang finish!')
        }
    })
}

module.exports.getLang = (src = 'src', pages = ['pages', 'components'], fileName = 'zh_cn.json', ignoredir, fileKey) => {

    readFileList(path.join(process.cwd(), src), pages, ignoredir, fileKey).then(res => {
        inputLangs(fileName, fileKey)
    }).catch(err => {
        console.log(err)
    })
}