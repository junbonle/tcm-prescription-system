# 中医处方结算系统 - Windows 防火墙配置

如果局域网内其他设备无法访问，需要开放 3000 端口：

## 方法一：PowerShell 管理员权限运行

```powershell
# 开放 3000 端口（TCP）
New-NetFirewallRule -DisplayName "TCM System Port 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow

# 如果需要删除规则
# Remove-NetFirewallRule -DisplayName "TCM System Port 3000"
```

## 方法二：图形界面设置

1. 打开「Windows 安全中心」
2. 点击「防火墙和网络保护」
3. 点击「高级设置」
4. 左侧选择「入站规则」
5. 右侧点击「新建规则」
6. 选择「端口」→ 下一步
7. 选择「TCP」，输入端口 `3000` → 下一步
8. 选择「允许连接」→ 下一步
9. 勾选所有网络类型 → 下一步
10. 输入名称「TCM System」→ 完成

## 方法三：临时关闭防火墙（测试用，不推荐长期使用）

```powershell
# 临时关闭（重启后恢复）
netsh advfirewall set allprofiles state off

# 重新开启
netsh advfirewall set allprofiles state on
```