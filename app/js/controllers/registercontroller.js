///////////////////////////////////////////////////////////////////////////////
// Register Controller
// Controller To Manage Enrollment of a new device
///////////////////////////////////////////////////////////////////////////////
// LD042 Advanced Web Engineering
// Andrew Hall 2016
///////////////////////////////////////////////////////////////////////////////
angular.module("LockChain").controller("RegisterController", ["$scope", "$routeParams","$location", "LockFactory", "AccountFactory", "PolicyFactory", function($scope,$routeParams,$location,LockFactory,AccountFactory,PolicyFactory){

	console.log("Entered RegisterController");
	$scope.accounts = AccountFactory.getAccounts();
	$scope.defaultAccount = AccountFactory.getDefaultAccount();
	$scope.selectedAccount=AccountFactory.getSelectedAccount();
	$scope.device={};
	$scope.device.permissions=[];
	if($routeParams.resource){
		$scope.editMode=true;
		$scope.pageTitle="1. Edit Device Details";
		initialisefromData($routeParams.resource);
	}
	else{
		$scope.editMode=false;
		$scope.pageTitle="1. Add Device Details";
		initialisefromEmpty();
	} 
	
	///////////////////////////////////////////////////////////////////////////
	// Function InitialiseFromEmpty
	///////////////////////////////////////////////////////////////////////////
	// Set Up The Initial View For The Page. Create Empty Data Structures
	// Populated With Sensible Defaults
	///////////////////////////////////////////////////////////////////////////
	function initialisefromEmpty(){

		$scope.device.address=AccountFactory.getNextDeviceAddress();
		$scope.device.title="";
		$scope.device.model="";
		$scope.device.description="";
		$scope.device.isLocked=true;

		for(i=0; i < $scope.accounts.length; i++){
			var grantFor = ($scope.accounts[i]==$scope.selectedAccount)
			var permission = {name:$scope.accounts[i],startDate:0, endDate:0,startDateString:"",endDateString:"", grant:grantFor};
			$scope.device.permissions[i] = permission;					
		}

	}

	///////////////////////////////////////////////////////////////////////////
	// Function Initialise
	///////////////////////////////////////////////////////////////////////////
	// Set Up The Initial View For The Page. Create Empty Data Structures
	// Populated With Sensible Defaults
	///////////////////////////////////////////////////////////////////////////
	function initialisefromData(resource){

		LockFactory.getResource(resource)
		.then(function(data){
			console.log(data);
			PolicyFactory.getPolicy(resource)
			.then(function(result){
				var permissions = []
				for(i=0; i < $scope.accounts.length; i++){
					permission = {name:$scope.accounts[i],startDate:0,endDate:0,startDateString:"",endDateString:"", grant:false};
					for(j=0; j < result.length; j++){
						if(result[j].issuedTo == $scope.accounts[i]){
							startDate=result[j].startDate;
							endDate = result[j].endDate;
							startDateString=result[j].startDateString;
							endDateString=result[j].endDateString;
							permission = {name:result[j].issuedTo,startDate:startDate,endDate:endDate, startDateString:startDateString, endDateString:endDateString, grant:true};
							break;	
						}
					}
					permissions[i] = permission;
				}
				data.permissions=permissions;
				$scope.$apply(function(){
					$scope.device=data;
				});

			});

		});
	}

	///////////////////////////////////////////////////////////////////////////
	// Function Register
	///////////////////////////////////////////////////////////////////////////
	// Registers and new devices and sets the requested permissions on the 
	// Device as requested. Lock Factorry Register Returns a Blockchain
	// Transaction Id. SetPolicy returns an array of transaction Ids
	///////////////////////////////////////////////////////////////////////////
	$scope.register = function(){

		LockFactory.register($scope.selectedAccount,$scope.device)
		.then(function(result){
			console.log(result);
			PolicyFactory.setPolicy($scope.selectedAccount,$scope.device)
			.then(function(result){
				console.log(result);
			});

		});
	}

	///////////////////////////////////////////////////////////////////////////
	// Function Register
	///////////////////////////////////////////////////////////////////////////
	// Registers and new devices and sets the requested permissions on the 
	// Device as requested. Lock Factorry Register Returns a Blockchain
	// Transaction Id. SetPolicy returns an array of transaction Ids
	///////////////////////////////////////////////////////////////////////////
	$scope.setPolicy = function(){

		LockFactory.register($scope.selectedAccount,$scope.device)
		.then(function(result){	
			console.log(result);
			PolicyFactory.setPolicy($scope.selectedAccount,$scope.device)
			.then(function(result){
				console.log(result);	
				$scope.$apply(function(){
					$location.path("/");
				});
			});

		});
	}

	///////////////////////////////////////////////////////////////////////////
	// Function Grant
	///////////////////////////////////////////////////////////////////////////
	// Grants Rights to the Relevant Resource
	// Parameters
	// Index of Subject To Grant Resource Access To
	///////////////////////////////////////////////////////////////////////////
	$scope.grant = function(index){

		PolicyFactory.grant($scope.selectedAccount, $scope.device.address, $scope.device.permissions[index])
		.then(function(result){
			
			//Update The Screen???
			console.log(result);
		})
	}

	///////////////////////////////////////////////////////////////////////////
	// Function Revole
	///////////////////////////////////////////////////////////////////////////
	// Grants Rights to the Relevant Resource
	// Parameters
	// Index of Subject To Grant Resource Access To
	///////////////////////////////////////////////////////////////////////////
	$scope.revoke = function(index){

		PolicyFactory.revoke($scope.selectedAccount, $scope.device.address, $scope.device.permissions[index])
		.then(function(result){

			// Should Really Have An Event Watcher To Update All Of This
			$scope.$apply(function(){
				$scope.device.permissions[index].startDate=0;
				$scope.device.permissions[index].endDate=0;
				$scope.device.permissions[index].startDateString="";
				$scope.device.permissions[index].endDateString="";
			});
			console.log(result);
		})
	}


	///////////////////////////////////////////////////////////////////////////
	// Function GrantToUser
	///////////////////////////////////////////////////////////////////////////
	// Update the Model When The User Chooses to Gtant Permissions
	// Issues the gtrant or revole procedure as appropriate
	///////////////////////////////////////////////////////////////////////////
	$scope.grantToUser = function (index){
		$scope.device.permissions[index].grant=!$scope.device.permissions[index].grant;
		if($scope.device.permissions[index].grant){
			$scope.grant(index); return;
		} 
		$scope.revoke(index);
	}	
	

}]);