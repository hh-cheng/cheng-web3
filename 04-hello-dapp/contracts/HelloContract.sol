// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract HelloContract {
  // 如果有 constructor，则在部署的时候会有2个transaction，一个是constructor，一个是initializer
  // constructor() public {}

  string name;
  uint256 age;
  event Instructor(string name, uint256 age);

  function setInfo(string memory _name, uint256 _age) public {
    // 可以写作 this.name = _name;
    name = _name;
    age = _age;
    emit Instructor(name, age);
  }

  function sayHi() public pure returns (string memory) {
    return "Hello Contract";
  }

  function getInfo() public view returns (string memory, uint256) {
    return (name, age);
  }
}
