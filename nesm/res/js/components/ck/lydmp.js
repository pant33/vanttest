Vue.component('lydmp', {
    template: '#lydmp-component',
    data() {
        return {
            prodInfo: [],
            local_no: [],
            dg: [],
            dgcate: [],
            cate: '',
            loading: false,
            did: 4,
            tp: 'prod',
        }
    },
    created() {
        var that = this
    },
    mounted() {
        var that = this
        that.getProdInfo()
        that.getDgCate()
    },
    methods: {
        scanQRCode(item) {
            var that = this
            wx.scanQRCode({
                needResult: 1,
                scanType: ["qrCode", "barCode"],
                success: function (res) {
                    var res = (res.resultStr).split(',')
                    var result = res[res.length - 1]
                    // result = '7-011G'
                    that.local_no[item.id] = result
                    $('#js_input_' + item.id).val(result)
                },
                error: function (res) {
                    if (res.errMsg.indexOf('function_not_exist') > 0) {
                        alert('版本过低请升级')
                    }
                }
            });
        },
        getProdInfo() {
            let that = this
            var _index = msgTools.toastLoading()
            $.post('/nesm/comm/api.php?act=get_rk_lists', {
                did: that.did,
                cate: that.cate,
                tp: that.tp
            }, function (res) {
                that.prodInfo = res.data
                for (let i in that.prodInfo) {
                    that.local_no[that.prodInfo[i].id] = (that.prodInfo[i].LOCAL_NO || 0)
                    that.dg[that.prodInfo[i].id] = 16
                }
                msgTools.scrollTop()
                msgTools.close(_index)
                if (that.prodInfo.length == 0) {
                    msgTools.toptips('未获取到记录')
                }
            }, 'json')
        },
        sublist(item) {
            let that = this,
                ishong = 0,
                reg = /^\s*$/g

            if (parseFloat(item.QTY) > parseFloat(item.cur_quan)) {
                msgTools.toptips('库存数量不足，无法出库')
                return false;
            }

            if (item.nmp == 8 || item.nmp == 9) {
                ishong = 1
            }

            if (confirm("确定出库么？")) {
                $.post("/nesm/comm/api.php?act=save_ck_ckd", {
                    imp_id: that.did,
                    local_no: that.local_no[item.id],
                    batch_no: '',
                    ind: that.dg[item.id],
                    dept: item.DEPT,
                    rk_ss1: item.id,
                    rk_ss2: item.sell_no,
                    rk_ss3: item.SN,
                    hong: ishong
                }, function (res) {
                    if (res.msg == 'ok') {
                        msgTools.toastSuccess("出库成功")
                        setTimeout(function () {
                            that.getProdInfo()
                        }, 2000)
                    } else {
                        msgTools.toptips(res.msg)
                    }
                }, 'json')
            }
        },
        search(tp) {
            let that = this,
                reg = /^\s*$/g
            if (reg.test(that.cate)) {
                msgTools.toptips('请输入产品名称')
                return false;
            }
            that.tp = tp
            that.getProdInfo()
        },
        getDgCate() {
            var that = this
            $.post('/nesm/comm/api.php?act=getDgtype', {}, function (res) {
                if (res.data) {
                    for (i in res.data) {
                        that.dgcate.push(res.data[i])
                    }
                }
            }, 'json')
        },
        getDglists(item) {
            let that = this
            weui.picker(that.dgcate, {
                defaultValue: [16],
                onConfirm: function (result) {
                    that.dg[item.id] = result[0].value
                    $("#dg_input_" + item.id).val(result[0].label)
                },
                title: '出库单据分类'
            });
        }
    }
})