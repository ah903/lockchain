import "./Disposable.sol";
import "./PolicyDecision.sol";

contract LockAPIBase is Disposable{
    
    uint8 DEMAND_ACCESS_0 = 0;
    uint8 DEMAND_ACCESS_1 = 1;
    uint8 DEMAND_ACCESS_2 = 2;
    uint8 DEMAND_ACCESS_3 = 3;
    
    PolicyDecisionBase policyDecisionPoint;
    LogService logger;
    
    ////////////////////////////////////////////////////////////////////////////
    // Policy Enforcement Points
    ////////////////////////////////////////////////////////////////////////////
    modifier requireAuthorisation(address subject, address resource, uint8 accessRequired){ 
       bool isAuthorised = policyDecisionPoint.IsAuthorised(subject, resource, accessRequired);
       if(!isAuthorised) { return; } _
    }
    
    function LockAPIBase(PolicyDecisionBase pdp, LogService eventLogger){
        policyDecisionPoint = pdp;
        logger = eventLogger;
    }
    
    function setPolicyDecisionPoint(PolicyDecisionBase pdp) returns (bool result){
        policyDecisionPoint = pdp;  
        result = true;
    }

    function getPolicyDecisionPoint() returns (PolicyDecisionBase result){
        result = policyDecisionPoint;
    }

    function setLogger(LogService eventLogger) returns (bool result){
        logger = eventLogger;  
        result = true;
    }

    function getLogger() returns (LogService result){
        result = logger;
    }    
    
}

contract LockAPI is LockAPIBase(){
    
    struct identityAttributes{
        bytes32 title;
        bytes32 model;
        bytes32 description;
        bool    isLocked;
    }
    
    ////////////////////////////////////////////////////////////////////////////
    // Map of Device address to Attributes (1-1)
    ////////////////////////////////////////////////////////////////////////////
    mapping(address=>identityAttributes) public lockAttrs;
    mapping(address=>bool) public lockAttrsSet;
    
    ////////////////////////////////////////////////////////////////////////////
    // Map of Device address to Owner Address (1-1)
    ////////////////////////////////////////////////////////////////////////////
    mapping(address=>address) public lockOwner;
    
    ////////////////////////////////////////////////////////////////////////////
    // Map of Owner to Device Address (1-n)
    ////////////////////////////////////////////////////////////////////////////
    mapping(address=>address[]) public ownerLock;
    
    ////////////////////////////////////////////////////////////////////////////
    // Map of Owner to Device Address Count
    ////////////////////////////////////////////////////////////////////////////
    mapping(address=>uint) public ownerLockCount;


    function LockAPI(PolicyDecisionBase pdp, LogService logger) LockAPIBase(pdp,logger){}
    
    function Register(address identity, bytes32 title, bytes32 model, bytes32 description, bool isLocked) requireAuthorisation(msg.sender, identity, DEMAND_ACCESS_1) returns(bool result){
        
        bool exists = lockAttrsSet[identity];
        if(!exists){
           identityAttributes memory newIdentity = identityAttributes(title,model,description,isLocked);
           lockAttrs[identity] = newIdentity;
           lockAttrsSet[identity]=true;
           lockOwner[identity] = msg.sender;
           ownerLock[msg.sender].push(identity);
           ownerLockCount[msg.sender]++;
           result = true;
           return;
        }
        
        identityAttributes storage currentIdentity = lockAttrs[identity];
        currentIdentity.title=title;
        currentIdentity.model=model;
        currentIdentity.description=description;
        currentIdentity.isLocked=isLocked;
        result=true;
    }
    
    
    function Transfer(address identity, address newOwner) requireAuthorisation(msg.sender, identity, DEMAND_ACCESS_2) returns (bool result){
        address oldOwner = lockOwner[identity];
        lockOwner[identity] = newOwner;
        ownerLock[newOwner].push(identity);
        
        address[] oldOwnerItems = ownerLock[oldOwner];
        bool done = false;
        
        for(uint i=0; i < oldOwnerItems.length; i++ ){
            if(oldOwnerItems[i] == identity){
                for(uint j = i; j < oldOwnerItems.length-1; j++){
                    if(j+1 <= oldOwnerItems.length-1){
                       oldOwnerItems[j]=oldOwnerItems[j+1];
                    }
                }
                delete oldOwnerItems[oldOwnerItems.length-1];
                oldOwnerItems.length--;
                done=true;
                break;
            }
            if(done) break;
        }
        
        ownerLockCount[oldOwner]--;
        ownerLockCount[newOwner]++;
        result=true;
    
    }
    
    function Lock(address resource) requireAuthorisation(msg.sender, resource, DEMAND_ACCESS_1) returns (bool result){
        identityAttributes storage record = lockAttrs[resource];
        record.isLocked=true;
        logger.LogLocked("LockAPI",msg.sender,resource,"Locked Successfully");
        result=true;
    }
    
    function Unlock(address resource) requireAuthorisation(msg.sender, resource, DEMAND_ACCESS_1) returns (bool result){
        identityAttributes storage record = lockAttrs[resource];
        record.isLocked=false;
        logger.LogUnlocked("LockAPI",msg.sender,resource,"Unlocked Successfully");
        result = true;
    }
    
}
