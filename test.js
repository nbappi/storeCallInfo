// ContactsController.js

=>
,'FileSaver', 'Blob',

=>

$scope.contactsUpload = function()
    {
      if(document.getElementById('upload').files[0]){

        var fileReader = new FileReader();
        fileReader.onloadend = function(){
          VCF.parseInput(fileReader.result, function(data) {
              $scope.contacts = {
                name : data.fn[0]['value'][0],
                address_1 : data.adr[0]['value'][2],
                address_2 : data.adr[0]['value'][3],
                phone : data.tel[0]['value'],
                email : data.email[0]['value'],
                upload : null
              };

            document.getElementById("upload").value = "";
            document.getElementById("ContactsTable_Form").focus();
          });
        };

        fileReader.readAsText(document.getElementById('upload').files[0]);
      }
    };

    $scope.vcfFileExport = function(data)
    {
      var apiKey2 = { name: 'contact/vcfExport', action: 'Add' };

      ActionService.getData(apiKey2,{ id : data._id}, function(item)
      {
        var fileData = new Blob([item], { type: 'text/plain;charset=utf-8' });
        FileSaver.saveAs(fileData, data.name+'.vcf');
      });
    };


// add-edit.html


<div class="col-md-6 col-sm-6 col-xs-12">
              Upload file(.vcf)
            </div> <!-- End Column -->
            <div class="col-md-6 col-sm-6 col-xs-12">
              <input type="file" ng-model="contacts.files" onchange="angular.element(this).scope().contactsUpload()" id="upload">
            </div> <!-- End Column -->


// contactss.js

exports.vcfExport = function( req , res)
{
    var vCard = require('vcards-js');
    vCard = vCard();

    contactsModel.find({ _id: req.params.id }, function( err , data)
    {
        if(err){
            res.status(404).send("Data not found...");
        }

        // upload file
        vCard.version = '2.0';
        vCard.firstName = data[0].name;
        vCard.cellPhone = data[0].phone;
        vCard.email = data[0].email;

        //set address information
        vCard.homeAddress.street = data[0].address_1;
        vCard.homeAddress.city = data[0].address_2;

        //set content-type and disposition including desired filename
        res.set('Content-Type', 'text/vcard; name="enesser.vcf"');
        res.set('Content-Disposition', 'inline; filename="enesser.vcf"');

        res.send([vCard.getFormattedString()]);
    });
};


// routes.js

// contact vcf export files
    app.get("/contact/vcfExport/:id", contactsController.vcfExport);



