// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

contract RedPocket {
  address payable public provider; // 主体
  uint256 public totalAmount; // 红包总金额
  uint256 public count; // 红包数量
  uint256 public claimedCount; // 已抢红包数量
  bool public isEqual; // 是否均分红包
  address[] public claimedUsers; // 已抢红包用户

  // 记录已抢红包用户
  mapping(address => uint256) public redPocketMap;

  // 给前端监听的事件
  event RedPocketCreated(address indexed provider, uint256 amount, uint256 count, bool isEqual);
  event RedPocketClaimed(address indexed claimer, uint256 amount);
  event RedPocketFinished(uint256 remainingAmount);
  event RedPocketRefunded(uint256 amount);

  constructor(uint256 _count, bool _isEqual) payable {
    count = _count;
    isEqual = _isEqual;
    claimedCount = 0;
    totalAmount = msg.value;
    provider = payable(msg.sender);
    emit RedPocketCreated(provider, totalAmount, count, isEqual);
  }

  // 获取合约余额
  function getBalance() public view returns (uint256) {
    return address(this).balance;
  }

  // 获取剩余红包数量
  function getRemainingCount() public view returns (uint256) {
    return count - claimedCount;
  }

  // 往合约里存钱(只有provider可以调用)
  function deposit() public payable {
    require(msg.sender == provider, "only provider can deposit");
    require(count != claimedCount, "red pocket is finished");
    totalAmount += msg.value;
  }

  // 抢红包
  function grabRedPocket() public {
    // 基础验证
    require(count != claimedCount, "red pocket is finished");
    require(msg.sender != provider, "provider can't grab red pocket");
    require(redPocketMap[msg.sender] == 0, "user has already grabbed red pocket");

    // 抢红包
    uint256 amount = 0;

    // 均分模式
    if (isEqual) {
      amount = totalAmount / count;
    }

    // 随机模式
    else {
      uint256 remainingAmount = address(this).balance;
      uint256 maxAmount = (remainingAmount / (count - claimedCount)) * 2;

      // 简单的随机数生成
      // amount = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender))) % maxAmount;
      uint256 futureBlock = block.number + 1;
      amount = uint256(blockhash(futureBlock)) % maxAmount;

      if (amount == 0) {
        amount = 1 wei;
      }

      if (amount > remainingAmount / 2) {
        amount = remainingAmount / 2;
      }
    }

    // 验证金额有效性
    require(amount > 0, "Invalid amount");
    require(amount <= address(this).balance, "Insufficient balance");

    // 更新状态
    redPocketMap[msg.sender] = amount;
    claimedUsers.push(msg.sender);
    claimedCount++;

    // 转账给用户
    payable(msg.sender).transfer(amount);

    // 检查是否结束
    if (claimedCount == count) {
      emit RedPocketFinished(0);
    }

    emit RedPocketClaimed(msg.sender, amount);
  }

  // 退款：如果红包没抢完，provider 可以取回剩余金额
  function refund() public {
    require(msg.sender == provider, "Only provider can refund");
    require(count != claimedCount, "Red pocket is finished");
    require(claimedCount < count, "All red pockets are claimed");

    uint256 remainingAmount = address(this).balance;
    require(remainingAmount > 0, "No amount to refund");

    provider.transfer(remainingAmount);
    emit RedPocketRefunded(remainingAmount);
  }

  function emergencyStop() public {
    require(msg.sender == provider, "Only provider can emergency stop");
    bool isFinished = claimedCount == count;
    if (!isFinished) {
      uint256 remainingAmount = address(this).balance;
      if (remainingAmount > 0) {
        provider.transfer(remainingAmount);
      }
      emit RedPocketFinished(remainingAmount);
    }
  }
}
