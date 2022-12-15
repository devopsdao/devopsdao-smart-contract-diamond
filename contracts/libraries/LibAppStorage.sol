//LibAppStorage.sol

pragma solidity ^0.8.17;
// import "../interfaces/ITaskContract.sol";


// struct AppStorage {
//     uint256 secondVar;
//     uint256 firstVar;
//     uint256 lastVar;
//   }


struct TasksStorage {
    mapping(address => Task) tasks;
    mapping(address => address[]) ownerTasks;
    mapping(address => address[]) participantTasks;
    mapping(address => address[]) auditParticipantTasks;
    address[] taskContracts;
    uint256 countNew;
    uint256 countAgreed;
    uint256 countProgress;
    uint256 countReview;
    uint256 countCompleted;
    uint256 countCanceled;
    string stateNew;
    address[] taskContractsBlacklist;
    mapping(address => bool) taskContractsBlacklistMapping;
}

struct Task {
    string nanoId;
    uint256 createTime;
    string taskType;
    string title;
    string description;
    string symbol;
    string taskState;
    string auditState;
    uint256 rating;
    address payable contractOwner;
    address payable participant;
    address auditInitiator;
    address auditor;
    address[] participants;
    address[] funders;
    address[] auditors;
    Message[] messages;
    // uint256 countMessages;
    address contractParent;
}

struct Message {
    uint256 id;
    string text;
    uint256 timestamp;
    address sender;
    string taskState;
    uint256 replyTo;
}

string constant TASK_TYPE_PRIVATE = 'private';
string constant TASK_TYPE_PUBLIC = 'public';
string constant TASK_TYPE_HACKATON = 'hackaton';

string constant TASK_STATE_NEW = "new";
string constant TASK_STATE_AGREED = "agreed";
string constant TASK_STATE_PROGRESS = "progress";
string constant TASK_STATE_REVIEW = "review";
string constant TASK_STATE_AUDIT = "audit";
string constant TASK_STATE_COMPLETED = "completed";
string constant TASK_STATE_CANCELED = "canceled";

string constant TASK_AUDIT_STATE_REQUESTED = "requested";
string constant TASK_AUDIT_STATE_PERFORMING = "performing";
string constant TASK_AUDIT_STATE_FINISHED = "finished";
  
  library LibAppStorage {
  
    function diamondStorage() 
      internal 
      pure 
      returns (TasksStorage storage ds) {
        assembly {
          ds.slot := 0
        }
     }

    function taskParticipate(string memory _message, uint256 _replyTo) external {
      TasksStorage storage _storage = diamondStorage();
      require(msg.sender != _storage.tasks[address(this)].contractOwner, "contract owner cannot participate");
      require(keccak256(bytes(_storage.tasks[address(this)].taskState)) == keccak256(bytes(TASK_STATE_NEW)), "task is not in the new state");
    //   _storage.tasks[address(this)].countMessages++;
      Message memory message;
      message.id = _storage.tasks[address(this)].messages.length + 1;
      message.text = _message;
      message.timestamp = block.timestamp;
      message.sender = msg.sender;
      message.taskState = TASK_STATE_NEW;
      message.replyTo = _replyTo;
      bool existed = false;
      if (_storage.tasks[address(this)].participants.length == 0) {
          _storage.tasks[address(this)].participants.push(msg.sender);
          _storage.tasks[address(this)].messages.push(message);
      } else {
          for (uint256 i = 0; i < _storage.tasks[address(this)].participants.length; i++) {
              if (_storage.tasks[address(this)].participants[i] == msg.sender) {
                  existed = true;
              }
          }
          if (!existed) {
              _storage.tasks[address(this)].participants.push(msg.sender);
              _storage.participantTasks[msg.sender].push(address(this));
              _storage.tasks[address(this)].messages.push(message);
          }
      }
    }

    function taskAuditParticipate(string memory _message, uint256 _replyTo) external {
      TasksStorage storage _storage = diamondStorage();
      require(msg.sender != _storage.tasks[address(this)].contractOwner && msg.sender != _storage.tasks[address(this)].participant, "contract owner or participant cannot audit");
      require(keccak256(bytes(_storage.tasks[address(this)].taskState)) == keccak256(bytes(TASK_STATE_AUDIT)), "task is not in the audit state");
      // TODO: add NFT based auditor priviledge check
      //_storage.tasks[address(this)].countMessages++;
      Message memory message;
      message.id = _storage.tasks[address(this)].messages.length + 1;
      message.text = _message;
      message.timestamp = block.timestamp;
      message.sender = msg.sender;
      message.taskState = TASK_STATE_AUDIT;
      message.replyTo = _replyTo;
      bool existed = false;
      if (_storage.tasks[address(this)].auditors.length == 0) {
          _storage.tasks[address(this)].auditors.push(msg.sender);
          _storage.tasks[address(this)].messages.push(message);
      } else {
          for (uint256 i = 0; i < _storage.tasks[address(this)].auditors.length; i++) {
              if (_storage.tasks[address(this)].auditors[i] == msg.sender) {
                  existed = true;
                  break;
              }
          }
          if (!existed) {
              _storage.tasks[address(this)].auditors.push(msg.sender);
              _storage.auditParticipantTasks[msg.sender].push(address(this));
              _storage.tasks[address(this)].messages.push(message);
          }
      }
    }

    //todo: only allow calling child contract functions from the parent contract!!!
    function taskStateChange(
        address payable _participant,
        string memory _state,
        string memory _message,
        uint256 _replyTo,
        uint256 _rating
    ) external {
      TasksStorage storage _storage = diamondStorage();
      require(_replyTo == 0 || _replyTo <= _storage.tasks[address(this)].messages.length + 1, 'invalid replyTo id');
      address contractOwner = _storage.tasks[address(this)].contractOwner;
      string memory taskType = _storage.tasks[address(this)].taskType;
      string memory taskState = _storage.tasks[address(this)].taskState;
      string memory auditState = _storage.tasks[address(this)].auditState;
      address[] memory participants = _storage.tasks[address(this)].participants;
      address[] memory auditors = _storage.tasks[address(this)].auditors;
      //_storage.tasks[address(this)].countMessages++;
      Message memory message;
      message.id = _storage.tasks[address(this)].messages.length + 1;
      message.text = _message;
      message.timestamp = block.timestamp;
      message.sender = msg.sender;
      message.taskState = _state;
      message.replyTo = _replyTo;
      if (msg.sender == contractOwner && msg.sender != _participant && keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_NEW))
      && keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_AGREED)) 
      && (keccak256(bytes(taskType)) == keccak256(bytes(TASK_TYPE_PRIVATE)) || keccak256(bytes(taskType)) == keccak256(bytes(TASK_TYPE_PUBLIC)))) {
        bool participantApplied = false;
        for (uint256 i = 0; i < participants.length; i++) {
            if (participants[i] == _participant) {
            participantApplied = true;
            break;
            }
        }
        if(participantApplied){
            _storage.tasks[address(this)].taskState = _state;
            _storage.tasks[address(this)].participant = _participant;
            _storage.tasks[address(this)].messages.push(message);
        }
        else{
            revert('participant has not applied');
        }
      }
      else if (msg.sender == contractOwner && msg.sender != _participant && keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_NEW))
      && keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_AGREED)) 
      && keccak256(bytes(taskType)) == keccak256(bytes(TASK_TYPE_HACKATON))) {
        if (participants.length > 0) {
            _storage.tasks[address(this)].taskState = _state;
            _storage.tasks[address(this)].messages.push(message);
        }
        else{
            revert('participants have not applied');
        }
      }
      else if (msg.sender == _storage.tasks[address(this)].participant &&
          keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_AGREED)) && keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_PROGRESS))) {
          _storage.tasks[address(this)].taskState = TASK_STATE_PROGRESS;
          _storage.tasks[address(this)].messages.push(message);
      } 
      else if (msg.sender == _storage.tasks[address(this)].participant && 
          keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_PROGRESS)) && keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_REVIEW))) {
          _storage.tasks[address(this)].taskState = TASK_STATE_REVIEW;
          _storage.tasks[address(this)].messages.push(message);
      } 
      else if (msg.sender == contractOwner &&  msg.sender != _storage.tasks[address(this)].participant &&
          keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_REVIEW)) && keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_COMPLETED)) &&
          _rating != 0 && _rating <= 5) {
          _storage.tasks[address(this)].taskState = TASK_STATE_COMPLETED;
          _storage.tasks[address(this)].rating = _rating;
          _storage.tasks[address(this)].messages.push(message);
      } 
      else if (keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_NEW)) && msg.sender == contractOwner && keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_CANCELED))) {
          _storage.tasks[address(this)].taskState = TASK_STATE_CANCELED;
          _storage.tasks[address(this)].messages.push(message);
      } 
      else if (keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_AUDIT))){
          if(msg.sender == contractOwner &&  msg.sender != _storage.tasks[address(this)].participant &&
              (keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_AGREED)) || keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_PROGRESS)) || keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_REVIEW)))){
              _storage.tasks[address(this)].taskState = TASK_STATE_AUDIT;
              _storage.tasks[address(this)].auditInitiator = msg.sender;
              _storage.tasks[address(this)].auditState = TASK_AUDIT_STATE_REQUESTED;
              _storage.tasks[address(this)].messages.push(message);
          }
          else if(msg.sender == _storage.tasks[address(this)].participant &&
              (keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_REVIEW))))

          {
              _storage.tasks[address(this)].taskState = TASK_STATE_AUDIT;
              _storage.tasks[address(this)].auditInitiator = msg.sender;
              _storage.tasks[address(this)].auditState = TASK_AUDIT_STATE_REQUESTED;
              _storage.tasks[address(this)].messages.push(message);
              //TODO: audit history need to add 
          }
          else if(msg.sender == contractOwner &&
            keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_AUDIT)) && 
            keccak256(bytes(auditState)) == keccak256(bytes(TASK_AUDIT_STATE_REQUESTED)) &&
            auditors.length != 0){
            bool auditorApplied = false;
            for (uint256 i = 0; i < auditors.length; i++) {
                if (auditors[i] == _participant) {
                    auditorApplied = true;
                    break;
                }
            }
            if(auditorApplied){
                _storage.tasks[address(this)].auditState = TASK_AUDIT_STATE_PERFORMING;
                _storage.tasks[address(this)].messages.push(message);
                _storage.tasks[address(this)].auditor = _participant;
            }
            else{
                revert('auditor has not applied');
            }
          }
      }
      else{
          revert('conditions are not met');
      }
    }

    function taskAuditDecision(
        string memory _favour,
        string memory _message,
        uint256 _replyTo,
        uint256 _rating
    ) external {
      TasksStorage storage _storage = diamondStorage();
      require(_replyTo == 0 || _replyTo <= _storage.tasks[address(this)].messages.length + 1, 'invalid replyTo id');
      address auditor = _storage.tasks[address(this)].auditor;
      string memory taskType = _storage.tasks[address(this)].taskType;
      string memory taskState = _storage.tasks[address(this)].taskState;
      string memory auditState = _storage.tasks[address(this)].auditState;
      // TODO: add NFT based auditor priviledge check
      //_storage.tasks[address(this)].countMessages++;
      Message memory message;
      message.id = _storage.tasks[address(this)].messages.length + 1;
      message.text = _message;
      message.timestamp = block.timestamp;
      message.sender = msg.sender;
      message.replyTo = _replyTo;
      if (msg.sender == auditor && keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_AUDIT))
      && keccak256(bytes(taskType)) == keccak256(bytes(TASK_TYPE_PRIVATE))
      && keccak256(bytes(auditState)) == keccak256(bytes(TASK_AUDIT_STATE_PERFORMING))
      && keccak256(bytes(_favour)) == keccak256(bytes("customer")) && _rating != 0 && _rating <= 5) {
          _storage.tasks[address(this)].auditState = TASK_AUDIT_STATE_FINISHED;
          _storage.tasks[address(this)].taskState = TASK_STATE_CANCELED;
          _storage.tasks[address(this)].rating = _rating;
          message.taskState = TASK_STATE_CANCELED;
          _storage.tasks[address(this)].messages.push(message);
      }
      else if (msg.sender == auditor && keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_AUDIT))
      && keccak256(bytes(taskType)) == keccak256(bytes(TASK_TYPE_PUBLIC))
      && keccak256(bytes(auditState)) == keccak256(bytes(TASK_AUDIT_STATE_PERFORMING))
      && keccak256(bytes(_favour)) == keccak256(bytes("customer")) && _rating != 0 && _rating <= 5) {
          _storage.tasks[address(this)].auditState = TASK_AUDIT_STATE_FINISHED;
          _storage.tasks[address(this)].taskState = TASK_STATE_NEW;
          _storage.tasks[address(this)].rating = _rating;
          message.taskState = TASK_STATE_NEW;
          _storage.tasks[address(this)].messages.push(message);
      }
      else if (msg.sender == auditor && keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_AUDIT))
      && keccak256(bytes(auditState)) == keccak256(bytes(TASK_AUDIT_STATE_PERFORMING))
      && keccak256(bytes(_favour)) == keccak256(bytes("performer")) && _rating != 0 && _rating <= 5) {
          _storage.tasks[address(this)].auditState = TASK_AUDIT_STATE_FINISHED;
          _storage.tasks[address(this)].taskState = TASK_STATE_COMPLETED;
          _storage.tasks[address(this)].rating = _rating;
          message.taskState = TASK_STATE_COMPLETED;
          _storage.tasks[address(this)].messages.push(message);
      }
      else revert('conditions are not met');
    }


    function sendMessage(string memory _message, uint256 _replyTo) external{
            TasksStorage storage _storage = diamondStorage();
            require((_storage.tasks[address(this)].participants.length == 0 && keccak256(bytes(_storage.tasks[address(this)].taskState)) == keccak256(bytes(TASK_STATE_NEW))) 
            || (msg.sender == _storage.tasks[address(this)].contractOwner || msg.sender == _storage.tasks[address(this)].participant  || msg.sender == _storage.tasks[address(this)].auditor), "only task owner, participant or auditor can send a message when a participant is selected");
            Message memory message;
            message.id = _storage.tasks[address(this)].messages.length + 1;
            message.text = _message;
            message.timestamp = block.timestamp;
            message.sender = msg.sender;
            message.replyTo = _replyTo;
            message.taskState = _storage.tasks[address(this)].taskState;
            _storage.tasks[address(this)].messages.push(message);
        }
  
  }