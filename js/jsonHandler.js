function main() {

    // Associate the button with the event download()
    document.getElementById("download-btn").addEventListener("click", function () {

        var filename = "project.cpp";
        var code = buildHeader() + buildMain + buildModule + buildTask + buildFooter() + 'lol';
        download(filename, code)
    }, false);

    var container = document.getElementById('container');

    let requestURL_ModuleTask = '../json/example.json';
    let request_ModuleTask = new XMLHttpRequest();
    request_ModuleTask.open('GET', requestURL_ModuleTask);
    request_ModuleTask.responseType = 'text';
    request_ModuleTask.send();

    request_ModuleTask.onload = function() {
        const objTask = request_ModuleTask.response;
        const jsonTask = JSON.parse(objTask);
        buildModule = buildModule(jsonTask);
        buildMain = buildMain(jsonTask);
        buildTask = buildTask(jsonTask);
        console.log(buildTask)
    }   
}


function buildHeader() {
    return headerCode = '#include <iostream>\n#include <memory>\n#include <vector>\n#include <string>\n\n#include <aff3ct.hpp>\n\nusing namespace aff3ct;\nnamespace aff3ct { namespace tools {\n\tusing Monitor_BFER_reduction = Monitor_reduction < module:: Monitor_BFER <>>;\n} }\n\n'
}

function buildMain(jsonObj) {
    parameters = getParam(jsonObj)
    initCode = 'int main(int argc, char ** argv)\n{'
        + 	'\n\t// get the AFF3CT version\n'
	    +   '\tconst std:: string v = "v" + std:: to_string(tools:: version_major()) + "."\n' 
        +   '\t\t\t\t     std:: to_string(tools:: version_minor()) + "."\n'
        +   '\t\t\t\t     std:: to_string(tools:: version_release());\n\n'

        + '\tstd:: cout << "#----------------------------------------------------------" << std:: endl;\n'
        + '\tstd:: cout << "# This is a basic program using the AFF3CT library (" << v << ")" << std:: endl;\n'
        + '\tstd:: cout << "# Feel free to improve it as you want to fit your needs." << std:: endl;\n'
        + '\tstd:: cout << "#----------------------------------------------------------" << std:: endl;\n'
        + '\tstd:: cout << "#"\n\n'
        
        + '\tsize_t n_threads = std::thread::hardware_concurrency();\n\n'

        + '\tint   K    = '+parameters.bits+';     // number of information bits\n'
        + '\tint   N    = '+parameters.codewordSize+';     // codeword size\n'
        + '\tint   fe   = '+parameters.frame+';     // number of frame errors\n'
        + '\tint   seed = '+parameters.seed+';     // PRNG seed for the AWGN channel\n\n'

        + '\tfloat R = (float)K/(float)N; // code rate (R=K/N)\n\n'

    return initCode 
}

function buildModule(jsonObj) {
    buildModule = getModule(jsonObj)
    let buildModuleCode = '\tstd::unique_ptr<module::' + buildModule.source + '\t\t<>> source \t(new module::' + buildModule.source + '\t\t<>(K    ));\n'
        + '\tstd::unique_ptr<module::' + buildModule.encoder + '\t\t<>> encoder \t(new module::' + buildModule.encoder + '\t\t<>(K    ));\n'
        + '\tstd::unique_ptr<module::' + buildModule.modem + '\t\t<>> modem \t(new module::' + buildModule.modem + '\t\t<>(K    ));\n'
        + '\tstd::unique_ptr<module::' + buildModule.channel + '<>> channel \t(new module::' + buildModule.channel + '\t<>(K    ));\n'
        + '\tstd::unique_ptr<module::' + buildModule.decoder + '\t<>> decoder \t(new module::' + buildModule.decoder + '\t<>(K    ));\n\n'
    
    return buildModuleCode
}

function buildTask(jsonObj) {
    task = getTasks(jsonObj)
    sck = getSocket(jsonObj)
    let buildTaskCode = '\tusing namespace module;\n'
        + '\t(*encoder)[enc::sck::' +task.encoder+ '      ::'+sck.encIn+' ].bind((*source )[src::sck::' + task.source + '   ::' + sck.srcOut+' ]);\n'
        + '\t(*modem  )[mdm::sck::' +task.mod+     '    ::'+ sck.modIn +'].bind((*encoder)[enc::sck::' + task.encoder + '     ::' + sck.encOut +' ]);\n'
        + '\t(*channel)[chn::sck::' +task.channel+ '   ::'+ sck.chanIn + ' ].bind((*modem  )[mdm::sck::' + task.mod + '   ::' + sck.modOut +']);\n'
        + '\t(*modem  )[mdm::sck::' +task.demod+   '  ::' + sck.demodIn + '].bind((*channel)[chn::sck::' + task.channel + '  ::' + sck.chanOut +' ]);\n'
        + '\t(*decoder)[dec::sck::' +task.decoder+ ' ::' + sck.decodIn + ' ].bind((*modem  )[mdm::sck::' + task.demod + ' ::' + sck.demodOut +']);\n\n'

    return buildTaskCode
}

function buildFooter() {
    return footer = '\tstd::unique_ptr<tools::Chain> chain(new tools::Chain((*source)[module::src::tsk::generate], n_threads));\n\n'

        +'\tstd:: ofstream f("my_chain.dot");\n'
        +'\tchain->export_dot(f);\n\n'

        +'\tstd::unique_ptr<tools::Sigma<>>noise(new tools:: Sigma<>());// create a sigma noise type\n'
        +'\tstd::vector<std::unique_ptr<tools::Reporter>>reporters;\n'
        +'\t// report the noise values (Es/N0 and Eb/N0)\n'
        +'\treporters.push_back(std::unique_ptr<tools::Reporter>(new tools::Reporter_noise<>(* noise)));\n'
        +'\t// report the bit/frame error rates\n'
        +'\tstd::unique_ptr<tools::Terminal_std>terminal(new tools::Terminal_std(reporters));\n'
        +'\t// display the legend in the terminal\n'
        +'\tterminal->legend();\n\n'

        +'\t// configuration of the chain tasks\n'
        +'\tfor (auto& mod : chain->get_modules < module:: Module>(false))\n'
        +'\t\tfor (auto& tsk : mod->tasks)\n'
        +'\t\t{\n'
        +'\t\t\ttsk->set_debug(false); // disable the debug mode\n'
        +'\t\t\ttsk->set_debug_limit(16); // display only the 16 first bits if the debug mode is enabled\n'
        +'\t\t\ttsk->set_stats(true); // enable the statistics\n'
        
        +'\t\t\t// enable the fast mode (= disable the useless verifs in the tasks) if there is no debug and stats modes\n'
        +'\t\t\tif (!tsk -> is_debug() && !tsk -> is_stats())\n'
        +'\t\t\t\ttsk -> set_fast(true);\n'
        +'\t\t }\n\n'

        +'\t// set the noise\n'
        +'\tfor (auto &m : chain->get_modules < tools:: Interface_get_set_noise>())\n'
        +'\t\tm->set_noise(* noise);\n\n'

        +'\tfor (auto &m : chain->get_modules < tools:: Interface_notify_noise_update>())\n'
        +'\t\tnoise -> record_callback_update([m](){ m-> notify_noise_update();\n'
        +'\t});\n\n'

        +'\t// set different seeds in the modules that uses PRNG\n'
        +'\tstd::mt19937 prng;\n'
        +'\tfor (auto &m : chain -> get_modules < tools:: Interface_set_seed>())\n'
        +'\t\tm->set_seed(prng());\n\n'

        +'\tconst auto esn0 = tools:: ebn0_to_esn0 (10.f, R);\n'
        +'\tconst auto sigma = tools:: esn0_to_sigma(esn0);\n\n'

        +'\tnoise->set_values(sigma, 10.f, esn0);\n'
        +'\tterminal->start_temp_report(std:: chrono:: milliseconds(10));\n'
        +'\tchain->exec([&terminal]() { return terminal -> is_interrupt(); });\n\n'

        +'\t// display the statistics of the tasks (if enabled)\n'
        +'\tstd::cout << "#" << std:: endl;\n'
        +'\ttools::Stats:: show(chain -> get_modules_per_types(), true);\n'
        +'\tstd::cout << "# End of the simulation" << std::endl;\n\n'

        +'\treturn 0;\n'
        +'\t}\n'
}

function getModule (jsonObj) {
    
    let source  = jsonObj['aff3ct::module::Source_random'].module_name;
    let encoder = jsonObj['aff3ct::module::Encoder'].module_name;
    let modem   = jsonObj['aff3ct::module::Modem'].module_name;
    let channel = jsonObj['aff3ct::module::Channel_AWGN_LLR'].module_name;
    let decoder = jsonObj['aff3ct::module::Decoder_SIHO'].module_name;

    let buildModule = { "source" : source, "encoder" : encoder, "modem" : modem, "channel" : channel, "decoder" : decoder }

    for(var k in buildModule) {
        buildModule[k] = buildModule[k].replace('aff3ct::module::', '')
    }

    return buildModule
}

function getTasks(jsonObj) {
    let sourceTask  = jsonObj['aff3ct::module::Source_random'].tasks.generate_N1.task_name;
    let encoderTask = jsonObj['aff3ct::module::Encoder'].tasks.encode_N1.task_name;
    let modTask     = jsonObj['aff3ct::module::Modem'].tasks.modulate_N1.task_name;
    let demodTask   = jsonObj['aff3ct::module::Modem'].tasks.demodulate_N1.task_name;
    let channelTask = jsonObj['aff3ct::module::Channel_AWGN_LLR'].tasks.add_noise.task_name;
    let decoderTask = jsonObj['aff3ct::module::Decoder_SIHO'].tasks.decode_siho_N1.task_name;

    let tasks = { "source": sourceTask, "encoder": encoderTask, "mod": modTask, "demod": demodTask, "channel": channelTask, "decoder": decoderTask }
    return tasks
}

function getSocket(jsonObj) {
    
    let srcOut   = stripBindings(jsonObj['bindings'].src_enc, 0);
    let encIn    = stripBindings(jsonObj['bindings'].src_enc, 1);
    
    let encOut   = stripBindings(jsonObj['bindings'].enc_mdm , 0);
    let modIn    = stripBindings(jsonObj['bindings'].enc_mdm, 1);
    
    let modOut   = stripBindings(jsonObj['bindings'].mdm_chn, 0);
    let chanIn   = stripBindings(jsonObj['bindings'].mdm_chn, 1);
    
    let chanOut  = stripBindings(jsonObj['bindings'].chn_mdm, 0);
    let demodIn  = stripBindings(jsonObj['bindings'].chn_mdm, 1);
    
    let demodOut = stripBindings(jsonObj['bindings'].mdm_dec, 0);
    let decodIn  = stripBindings(jsonObj['bindings'].mdm_dec, 1);

    socket = 
        {  
            "srcOut": srcOut,
            "encIn": encIn,
            "encOut": encOut,
            "modIn": modIn,
            "modOut": modOut,
            "chanIn": chanIn,
            "chanOut": chanOut,
            "demodIn": demodIn,
            "demodOut": demodOut,
            "decodIn": decodIn,
        }
        console.log(socket)

    return socket
}

function getParam(jsonObj) {
    let parameters = { "bits": jsonObj['parameters'].bits, "codewordSize": jsonObj['parameters'].codewordSize, "frame": jsonObj['parameters'].frame, "seed": jsonObj['parameters'].seed }
    return parameters
}

function stripBindings(text, socket) {
    arr = text.split(";");
    if (socket === 0) { // this is an input
        code = arr[0] // output
    } else if (socket === 1) {
        code = arr[1] // input
    }
    return code
}
// Takes filename and text content to write a downloadable file when pressing a button
function download(filename, text) {
    var element = document.createElement('a');
    element.style.display = 'none';
    // Define the data of the file using encodeURIComponent
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}	

