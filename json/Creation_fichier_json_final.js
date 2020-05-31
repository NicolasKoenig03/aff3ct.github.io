function request_ModuleTask () {

    //ATTENTION : Ajouter la récupération du json à la place de la ligne commentée
    /*const obj_module = JSON.stringify(objetJS);*/
    const json_module = JSON.parse(obj_module);

    var json_object = [];

    for (var i = 0; i < Object.keys(json_module).length; i++){
      AddModule(json_module, i, json_object);
    }

    console.log(json_object);

  }

  function AddModule(jsonObj, i, json_object){

    var source = Object.keys(jsonObj)[i];   // TypeModuleAbstract  

    if(jsonObj[source].class_is_module == true){

      var ListTypeModule = [];

      for (var k = 0; k < Object.keys(jsonObj).length; k++){

        var var_name = Object.keys(jsonObj)[k]; //TypeModule

        var inheritence = jsonObj[var_name]['class_inheritence'][0];

        var index = inheritence.indexOf(jsonObj[source].class_short_name);

        if(index !== -1){

          ListTypeModule.push(jsonObj[var_name].class_short_name);

        }

      }

      var tasks = Object.keys(jsonObj[source].class_tasks);

      var AddArgument = [];

      var AddSocket = [];

      var AddTaskTable = [];

      var ListTasks = [];

      for(var i = 0; i < tasks.length; i++){

          var task = tasks[i];

          var method = Object.keys(jsonObj[source]['class_tasks'][task]['method_arguments']); // nbSocket
          var short_name = jsonObj[source]['class_tasks'][task].method_short_name; //Task

          var Nb_socket = method.length;

          for(var j = 0; j < method.length; j++){

              var parameter_method = Object.keys(jsonObj[source]['class_tasks'][task]['method_arguments'][method[j]]);

              if(jsonObj[source]['class_tasks'][task]['method_arguments'][method[j]][parameter_method[0]] !== null){

                  for (var k = 0; k < parameter_method.length; k++){

                      var Argument_name = parameter_method[k];
                      var Argument = jsonObj[source]['class_tasks'][task]['method_arguments'][method[j]][parameter_method[k]];

                      AddArgument.push({ [Argument_name] :  Argument })

                  }

                  AddSocket.push({ 'Argument' : AddArgument});

                  var AddArgument = [];

              }
              else{

                var Nb_socket = Nb_socket - 1;

              }

          }

          for(var j = 0; j < ListTypeModule.length; j++){ 

            AddTaskTable.push({ 'TypeModule' : ListTypeModule[j], 'NbSockets' : Nb_socket, 'Sockets' : AddSocket });

          }

          ListTasks.push({ [short_name] : AddTaskTable});

          var AddArgument = [];

          var AddTaskTable = [];

          var AddSocket = [];

      }

      var AddModuleAbstract = {'TypeModuleAbstract' : jsonObj[source].class_short_name, 'Tasks' : ListTasks } ;

      json_object.push(AddModuleAbstract);

    }

  }