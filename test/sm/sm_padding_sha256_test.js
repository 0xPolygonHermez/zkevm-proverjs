const chai = require('chai');
const { createHash } = require('node:crypto');

const { assert } = chai;
const { F1Field } = require('ffjavascript');

const {
    newConstantPolsArray, newCommitPolsArray, compile, verifyPil,
} = require('pilcom');

const smPaddingSha256 = require('../../src/sm/sm_padding_sha256');
const smPaddingSha256Bit = require('../../src/sm/sm_padding_sha256bit/sm_padding_sha256bit');
const smBits2FieldSha256 = require('../../src/sm/sm_bits2field_sha256');
const smSha256F = require('../../src/sm/sm_sha256f/sm_sha256f');
const smGlobal = require('../../src/sm/sm_global');
const { sha256 } = require('../../src/sm/sm_padding_sha256bit/sha256');

// input = [];

const input = [
    {
        data: '',
        reads: [],
    },
    {
        data: '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20',
        reads: [32],
    },
    {
        data:
            '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'
            + '2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40'
            + '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'
            + '2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40'
            + '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'
            + '2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40',
        reads: [1, 2, 3, 4, 5, 6, 7, 5, 31, 32, 32, 32, 32],
    },
    {
        data:
              "3b63f9c39536c9fca6221a3d69552a59ee4d301a518267665408fe9b5759090c"
             +"a3954cf2fc0adf8a6890d717fcaa00ecd9951b5fcb1a0758b5ded0516fda1053"
             +"abf07dafe243d114e4cc7d4a0f7ac7f8c117dfd54e9ced2a94e965541d6abe9b"
             +"468320eb639c4f175226a848ccd216410db13c33899ca53704aab10c12d8422c"
             +"cbed48ff36d47083509fe2e8de65de815185f444fcc3cea738d782b11c8d0055"
             +"10d24fd6f7b78a0414a836c9692d41b447bfd33489d06e66971f68726e11191d"
             +"d6c3d423458881a86fa14f20e2c0dcda8c8a4ed569eb9e3f37e9b7c4daaa941c"
             +"ca94fc2fede38a80b141f23444b05cc0b8efcd569ebf78074369344ce7a76706"
             +"323f6dd59a9ae3810a2de8f1133d4caf69b8d4accefdfa44a16cb69f54ef3746"
             +"1cfeaf49aa878fc4c6130cd4051e58d12c45fec85051e4c6664ac4168b95d1e0"
             +"250bb713536127ce3f9be7e045705c65d143d767ae468ce60305daf8019c7bca"
             +"8d59c6c7eaa7a6e12596f65c4047c817f33c643f9df8b6024b94c37c6b839c2c"
             +"ec774151a0800e1eafe8cee709453c34f0ee797aa650b16c38ba968300f35353"
             +"895934548e0828a4a5845e7b39cbfb5f37360ea02f7dc701a02b1081f3aaa83d"
             +"920aef68c9b241f80976694d0020e551c26b373142788d00521e59eba1ba9ade"
             +"c13c50476f3cd4f6cf5b303e7cbcb96049e7a2ab3261b171fe041403cfcce9f4",

        reads:[32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32]
    },
    {
        data:
             "94186f66807a042ef7baf04f352fdf443f06f850396989bfebe787f8812fc001"
            +"2f8f9817a9b83c1d34d037abf7089cb3bc4df9ac716d3de6499c658c79ae1f7d"
            +"b2006def5b7344111c01842b0daaa1e9b43a36667cf4de62fd2151e0c81c7da1"
            +"6aa04d7c7744770b1b149ec86bb1a8f83543125d739611d5356db5a6b6389149"
            +"1ea6fe0a294a3f440a38a16797bdbcdf3fbd2607add4eda15cbe5c3fb2ba421d"
            +"48a4db17fc91c2f322d01627f5b7eb081350173dd7235973f3b34a408c18df94"
            +"761bf43262eafa593d6dc88ec82c87a7343d69e2138829ee739a550d58c3908c"
            +"3d52b3da9c0c33a48414edd02b2d24086e29204edb52e264667a4bd08b238411"
            +"2b43e2114ab6e7d75791ea70add0ecbaeee2b57c347a94f097b4b068f0295437"
            +"04e4070580fcd24d1655b2d4e0a5e7f69708354e7b9b39eb17bfa781b40a4480"
            +"cb23ea0683f99cb016deb493d05d8103ede6e03988a4c0f5a3ecae62ae044c82"
            +"e786794c77d89aacf000949f03e329a6269eee5f28b136e04f5ccfe8ab81719c"
            +"524fb498a0797a2cebabf0ed8fefff19054247384ad7d654b994386aa927f031"
            +"4b1805ebde792036229d05ed3447a51931ea6cb91cc871491617eb8d2115e804"
            +"a7cdcdc6808640b6765b0fd2c0ea3dc59b26ba215febcead48f861e6b229ab14"
            +"d15b50bf6ad47716d13384a9d79b43fd9b90fef438a2c8f47791fd0721d1600c",
        reads:[32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32]
    },
    {
        data:
             "8b5fc94ecff2ba222a09afd061e6bb06764ad11e44302e140aa47224d0ccbf83"
            +"dfa00a5caf90095f924664cb8a118118f0177a385a4242a64ca0c360f79526a5"
            +"12197a5727093ae562f105ca691f0f00edd9473cf507d994c20d9b8ae31cb9f9"
            +"e3f962f616ccee2c40caab7fd7a8e0195654b2b7aa64bde0882c27b6a038a771"
            +"f082f5d401f09d72222aeb5aff842a1bb14963dc782291221d05a10f321b3ca2"
            +"1dab83007edc44d8b77cbd7c2226156de8e87e478ae7b87291a5c79a5a256656"
            +"3e3634ddf380d4270ce021f81da76ea2aaa14689133f8e1fd15fc1dc59b9ef4f"
            +"b74733f5645d1446532d550dd52486b288a1615584799308ad0e94d9ab8869ea"
            +"b4501e7c14b0ef250726147868e49cfa575febdbb57809e6dac18c2412318692"
            +"6b382c5406d4afb5400aa53129916ca49ddb25046c7d4f4fff455b7ad484054e"
            +"ba3dc345d22a90d479393134d841a5b0da058327a36eadb7e0fb51af32436d65"
            +"14ee4db08dc1ef66461886e0cc7b93ded86f04b9ec404ddf74ab862061d4acc9"
            +"0a0a0f39cf16c6157ff38bef8651ba854bdaf51b399939c486d92d22fd3d2995"
            +"6c0a6db2d20308e9be9a8f7f50c5fded84a73777be82328a0fc564ad4f98f092"
            +"493777d0ab1b9c8f953838885a9c52bebf371d326fd67b152c774d96d097b32e"
            +"8cda75654369ddfc449f1da26348d3b6eadaee03636bb64f80a2a0a81e2c960c",
        reads:[32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32]
    },
    {
        data:
             "87a2b01a9d016687c843aac1336cbc3977e2fd9f1452a3017511756dbc9f62e8"
            +"34b72679432bae90ecc3de87b417a35385d2efe582519b9a695d4256b5a37b8f"
            +"5c6200b90791aba6b6cd7e7a792c8470afa87c14f6a0321317fdc5daca21acec"
            +"134dfa863492abb7f03ed8776b4abbb991d330e07e74c3186ee6d5cbb0c4294d"
            +"7d60ec66de3018a35b44e60c457425da7b2d348d93da81e02c9ed04f1bcd921a"
            +"e1dec6104ef8de86f6a56d68209d12e243d6e96b6399eff92faee8bf5062c02a"
            +"3541bdf07c30ea6040a7c0c3be1de7f9e7c39b4109d3e9a50e073469e44c4935"
            +"4b078b8018a9233e7758af3e4ef8a279e04541bb98d3c7cc414b61a05b63d196"
            +"74ce742876f22463799726a5b061b5dfecd79795c5ac9cfee9cc8f55639031cb"
            +"0e753aa64a124ca858ff669089134bfc634dbe1ff84fff97b966296dbb1094ca"
            +"673bcf0e6182c783a47c62ff77fa1c116847a1f2e8965942a9c153b5dccc4c0d"
            +"5305875f88af0435d348a22f42d9367fda0ebbb221da40192418c370fa423356"
            +"77045be5b4ae07de3ba1bfbc6212c914c3a470b5c2faee7be4c168437d5fd857"
            +"5e32293528c68d37cd8f38cc74d2f20627f77807398f0763ac847b6e6fbfc364"
            +"10a70d8fe3132fa5d47763b625a0433be934075ab01f02210728cdb0edbafcda"
            +"7d33f005645751fd54209b587730cec73e886fef532f7daca4a7969cb168361e",
        reads:[32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32]
    },
    {
        data:
             "cabfdbdeb79621f3dc4c6de97714e886505797a12522354924c05fda002e5d67"
            +"198cb3f75315fece5ea1b9698e1c9731331b13384da77fba0c25e86e8123c5d7"
            +"5a758cdbcc9aba954a37c630e8ba5604a6d9a211a094492d9c95311d497012d6"
            +"fb132049077314c5f8f18cc184b81759d22977142165a0c30059d565034ec191"
            +"fba63db80cb62e0db5b2e95cd9deeb14376c7b74e7c8a75648f4afe3b72cb540"
            +"ec866e7a31c3b6c3a9afe86057f22d81ef8338c20a2b056959123f063959e4e3"
            +"94f85eff825f90af862e5b48a0c5d8069e563fbe795846b9f976eb1eb1740699"
            +"369eea2f138f544a8a80afcbc5a05d503daeb662e22d0dae213ac7369c586c27"
            +"a7fbd5ea00c7aeda4d2332a699c583dfd55d7a324398b23c1007904e343a44fa"
            +"6299b97b08fe74aa4b957b09ba541e78a95f4511104d6edd9cec470f457d3bc2"
            +"7870be279ca180247d6e815bac1babb6d695b4537f92885cb45b4e1e894d3f2c"
            +"2cc41659dfdd111b6e649afd1ca119f181d7ac6d0ade0973facab76f65ed909c"
            +"c57536ab0b95dd672468e5931bedb872fda85bfab0cac012bc03435a4c7956ae"
            +"50b381d5136ba03ae64c97af8c0f1df1194b2422ad48defae92bbd73ee85bad3"
            +"b1d006d7b1d20304b5cebbd77eee9a23b9a9b8e9e8e05569bd9bdc92e9c0d861"
            +"7f102c0e30ff25f39785d1b371ff7b62f5aa349514cf80647d6cdb8853f5921f",
        reads:[32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32]
    },
    {
        data:
             "a7ebf76b0a6b4333d79d25b2a1ef8a7f0adf2e5798552d3d343a32bb387e0ced"
            +"12fc58ca46b9c173ed4289eeb8723d41677a37951cf6edbd75418876f9a39c2c"
            +"81adfa81df838633b9abf5f9840aa8af788361ed19e4b630cd068280a8fdebd4"
            +"f7d355d72f1d1b260972bbe6aff432d7f642f3f8f3faf39b947c09a0bd2ef156"
            +"dbec3dc385cfa9d922bc7375d1d409ecfb98196f2d556e01f90d068428172ade"
            +"867f53dbb64a14055500d3b646bfb221a5b2088ec1339570357f8224a14b3c55"
            +"194c76edf1e1dd7854a7e282b2e43353be4c860bf29bd2b641cf4eecc0244bc0"
            +"4d8d61108caaec56ea55d4698bfd2cc814077105bfff752dfb2200f21a8b02af"
            +"a4f498f29832eb1b6c66dddbd7f3fad9e7aee53bcc24cc3855275cb22a287582"
            +"565b7398b6ca4e9189f1847b6f9e1fe460e572ce03b13916b27a8ba2fde01116"
            +"77638061673610de4b08e36eac2bd1a8fb2dac78073ce276137431467787b954"
            +"6d30105cf312d874bf2a75c00f44daa7d6595deddbd3fce468865b2f4284fed2"
            +"83cdf449a1193a9f101db40fe6bab5b52ec4d8a2bfee5ba6bfb4f8415f009301"
            +"b4fc3311945a6d5708df4fbba9b8adef1e3ecb5c56332b415aaa42149d02635d"
            +"be7cff43dcb4294cc0a9ed5f2d13dfe6a73a43179277e9440fd4ca1d677e4f69"
            +"b75ffc977f5407dea7b33c4d379910d9b924900a47238d6d279c4d7bfdc1b66c"
            +"dd3e426a65566f5c6dbfa17b405fcc2a31a6c65a0abe3fa1f8a1fc7fca899159"
            +"e8e764fb0c6d9cc5c6371dd21bb4d3d16ee0c1cb9f6431d89339442cc28b0f76"
            +"14adaf547383f95550bc5e6f79204225a89fdedaf8f01fc0d47b0b419a7f364f"
            +"9bdac521ddccce9a17162cdada4f9d7e32918dbad6dd368481b4b4358332e43d"
            +"f357c87e1e8372460aebfad645ba572d83e2c16fe5af7a6626ba4cd6ff03de7c"
            +"da7b570f212ce5a5007c74c5a1fdb1572c0f94f2adea8d6d313d613e9c32a967"
            +"879ac1ecdd62331ea45923c409f47e95919d910c05fa68130cc66e070b107f45"
            +"7389e05bc861e785e1df07b5faf671a90c0ba5205a71fc9dbda95f1e54e8d4c1"
            +"7087af5db1e8c100923e83af99d72b3e4d1e9deec74004b949c61b64bd3a4d45"
            +"e186a61447d253a43dd2ea94e8db39b62811b3bc33c2b364232059f60e54f2c4"
            +"b1db38c2167bed8ade199d44a3a0a7195e9725f0a392e4ca046d936648282212"
            +"2dfac019373a2de36355adccd54cea1bbb29b3572d13a91732cdaaebef675e7d"
            +"ce93b04427340e415e6768a7d1de05c0e76d1bbf75eab627b3e2a6a4688706ae"
            +"32de0bf35ba92e6607ccb7b4a3bf14ff6231a0b81590ca5ded73707c38f4dda9"
            +"cb7367b100470b1dcafc47b9c198632e7bdf604ef368a14cf107ae3f4804043a"
            +"d6e8490b1e1f7f03a664f235f78050b66b18171696ab42d02cf03bb4d486eaa2",
        reads:[32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,
               32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32]
    },
    {
        data:
             "d8764854fab96f7e9af9aa21b70987edac58bb7b78f7af9a458c034850f4bd06"
            +"be298e5a18975b8f133d9d703187c4d1aa413edaf923c3e4832c62b8f399bf4e"
            +"3c49c58daa6c7863b9833c78ebda687361297fb0a08a2516910286dbc694da35"
            +"10c754983d06f0660fc0fad8151fbcb218aa95cd7836a1e36cfec6bf1b90c436"
            +"9919f340019963e025005de5d73785a2008d4b6afad0943183d259bf7bf19a11"
            +"d77496127091f3364847386f80f8cf745b83079da774904884ac45e610076b0d"
            +"e50a0c314fb2d3988c0b0718f83b1ec86f847dc1c36d0ced5d55e8dd8bd798c6"
            +"13b3033f13a7fe3ad3eeb00d6ed9bbd5f37cd6d2b5543d7fe908df43021cf21e"
            +"9cf3d16bef8ada3b7d56b58bb0b4f3b8ea3a4f77f4e12d06c28bf176b93f3569"
            +"9b1b1b86565832721d96ab43115fd4dcb02722a66079fd239c19fafc9c3357ee"
            +"89e91f0ef99ace8c8a70dd4a9b70756985bff7c1fccaaa0f936d7aa3da5a08a7"
            +"564470ee9bb329499408f1e98ac6d2ba24fa29f5832ee142b3090d95174e5ef7"
            +"c0da707d080994e1b50ad3364bc9b57db5febf586719d5536749b3b71e697076"
            +"0db94ce9b04814233e77f695dd5ec067c25dc8f4d3962adc45c00ca83fa83719"
            +"65573775fcf2f4b488691dde38247370c5bbd4178c04995d958013df50e8411d"
            +"822a2b17b87969f336a63be73f20ca7daff18467b208c091d5ff60e3a881088e"
            +"ec62686837a4d54da04d26e50d9178b7eaca5bae482d4006ca892dc0b2a4debf"
            +"f50bb854acce28684eee271e9131bed91fa2af13d0bb356e54d26bf7f5815c81"
            +"d7731d3b478d50b34d15c003770c142b83aff44d258d485585d8a764d809a1a2"
            +"c6e572aedba91056f58264d05a1691f2a84d78462e5b6fe2653783c508220419"
            +"2ccf9109f25b0273e47185d2e31ea2caa9808a4902dbdb276c0e39c2295c1a84"
            +"f15c49fc0d2e8574c800d1ffd41bcc7066125a5785f7077f98f429caadd984b6"
            +"4debb8f2e077cf8389690eb4d97081c0c5dbed5973e478b166f593c273fa0bab"
            +"01e6a3bd5097dfeed988d8b3a5f4a29339df4bbda2035b399e6143203c1d407d"
            +"5c17a736f2abe808a99f6249afc566d34205ce512f0058c438f97ce9408b03d8"
            +"667aee9f74b75b2d045e79df8ca0f363ddfed4309a5e695cf4ec8c01d3ca954a"
            +"b0b8e61b6c8b5c2b4648886262f026677ac6c6dbbf0efe716052d8164fabc605"
            +"d374a53f85266d9c42f94862c3474f00c5be7d1d7dea818c5e3eafc979db65f5"
            +"8696015011233f7dd6339489ca472e43968452e92c691cf4c825e4153f199670"
            +"6300be81daee9b5b1e5d6c73757dffadb2ac7e380c37411a52985520cc978162"
            +"855b5b16072800f7cc2f3529729b458d5309212698baf3a3705c9a0ca3ed3c59"
            +"4494c5fed432fc30d9ddc5a3bbdb9e835598d3478845a487144d5029af06b61d"
            +"f87e2bb9c6581497f15a257bb9c83e1968175bbceb24e77a2a9eadb1a38eb2a7"
            +"633cc5f2a661b6235295871ee5c0fba08512d917ad0646ddbee936839da41bb8"
            +"1f91995751acf18ba5f174ae0fc6ee6db0b609e5f9afab61462cbe3a87611a32"
            +"9e74c09476f65d02453f114007d88059c55b1d2135be180e8924628d961f95e4"
            +"2aff50524087e28b7d6c1ec743107401c4bfd0ac91171da7aeaf85f2ed5fb992"
            +"25142af400757639c7badf2662cf0094a8c7ea5802d05d9fa57dd6826416c5ba"
            +"9757ccc0655b2745b987e3db9995347d8d97451686f3cfd6e6882a09493b74d3"
            +"c3a8569c9e885434d976aa9071361bffdb4c2f50f56d00cc4a334f83f2249c21"
            +"f9ce509ecaafe82c36e8656c0b46105d28e696ca6c54428c0a425c932bb7e312"
            +"c264deb3fc97cdac6b2ce2e50fa4ec7f9241c0799ff564ba3c68652293e608f8"
            +"d13fc8c5764ae433d054138724a751d5ff173f6856379d8fda7248215bec0c3d"
            +"1fcee1100ec631e372844ef3b1cb722862407180ff1795e8dd225f6fc35a4b27"
            +"ba3f1fbc7be8d416a315505d26407d23056c04d7fbdf2ef75c2b46ec74363607"
            +"5b47e591b48fabc833cfb445a0ed27812047e4a29d6abe1e5030196dea70499f"
            +"49138299c2e9ba00eeb97130cb0b9a123e290bb0ce8d6973fd098a2057e902b2"
            +"c7986b6d2d17cf0558884e296c46360859eff87aa02ce02b2da0e6834613014d"
            +"245a239678c509239154514779244e4997d06b7f28950a3d189059842b62fa3b"
            +"e647c085ea4f62933c28efeaa45654932195c52c96356e39389f2b21c37d4e20"
            +"6643d9c1341ae67b8dc917583ed50a8c2f9660c72da4c95d5110351a2fef4984"
            +"f97facbfb4daa2a9ba4e9e71870b25ea78664f615477bcd9364b87d73468c281"
            +"ad3dae352c9fa3de7710f608ae0cdf7233ff868b13bb5a9a69e03cafc12034c0"
            +"5fd66561740f00423f87100610dbd1b8b7eb6b6bf341bfc3d63e0fb2605551a2"
            +"e5fbd7ce820806398c0efaddf4998c8fbdae5ab50f860daea24224100baa4f00"
            +"25e49b0d5c054e7f2524fc4a916c0e7d233cc4376f3916666ab81b6c0568ac8d"
            +"4adc482a300a4c4fbd202237e41ba846e81a25bd7816e188b4a480e65f14c691"
            +"4dec478ae0cea19bc46f360784e1ee096b1994e2a71a096004594c145ac350a5"
            +"23ff2ee1b0a73b1c742294454416bc815db12a91274c69ee015588250f5a1c5a"
            +"224d8dcc37e412744fe1de14bd170c188ef867ddaf1199af763df923519879f5"
            +"8a498490c5fa7da47ca2ba39b2d3dba40d3d92ad552a1844132657aef5d339f1"
            +"3166f4b88c6d4753261b6d77bff6b272af486a326d4e2fbec34564471d3ee9e3"
            +"76a3cba35c0cde3643f9fe908bc9311e6bfdda69521a40b000d461e7f4a54d40"
            +"1b38b1d4b12f2e60fbee50ba822a5080a42c7388c32b25e31fefb875ea4e45fd",
        reads:[32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,
               32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,
               32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,
               32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32]
    }];

describe('test padding sha256', async function () {
    this.timeout(10000000);

    it('should sha256 the abc', async () => {
        const hash0 = sha256('abc', 'hex');
        const hash0expected = createHash('sha256').update('abc').digest('hex');
        assert.equal(hash0, hash0expected);
    });

    it('should sha256 the empty', async () => {
        const hash0 = sha256('', 'hex');
        const hash0expected = createHash('sha256').update(Uint8Array.from([])).digest('hex');
        assert.equal(hash0, hash0expected);
    });

    it('should sha256 the long string', async () => {
        let s = '';
        while (s.length <= 1025) {
            const hash0 = sha256(s, 'hex');
            const hash0expected = createHash('sha256').update(s).digest('hex');
            assert.equal(hash0, hash0expected);
            s += 'a';
        }
    });

    it('It should create the pols sha256 padding', async () => {
        const Fr = new F1Field('0xFFFFFFFF00000001');
        const pil = await compile(Fr, 'pil/padding_sha256.pil', null, { defines: { N: 2 ** 23 } });
        const constPols = newConstantPolsArray(pil);
        const cmPols = newCommitPolsArray(pil);
        await smPaddingSha256.buildConstants(constPols.PaddingSha256);
        await smPaddingSha256Bit.buildConstants(constPols.PaddingSha256Bit);
        await smBits2FieldSha256.buildConstants(constPols.Bits2FieldSha256);
        await smSha256F.buildConstants(constPols.Sha256F);
        await smGlobal.buildConstants(constPols.Global);
/*
        for (let i = 0; i < constPols.$$array.length; i++) {
            const arr = constPols.$$array[i];
            for (let j = 0; j < arr.length; j++) {
                assert(typeof (arr[j]) === 'bigint', `const pol: ${i} w: ${j} desc: ${JSON.stringify(constPols.$$defArray[i], null, 1)}`);
            }
        }
*/
        const requiredSha256 = await smPaddingSha256.execute(cmPols.PaddingSha256, input);
        const requiredSha256bit = await smPaddingSha256Bit.execute(cmPols.PaddingSha256Bit, requiredSha256.paddingSha256Bit);
        const requiredBits2FieldSha256 = await smBits2FieldSha256.execute(cmPols.Bits2FieldSha256, requiredSha256bit.Bits2FieldSha256);
        await smSha256F.execute(cmPols.Sha256F, requiredBits2FieldSha256.Sha256F);

        for (let i = 0; i < cmPols.$$array.length; i++) {
            const arr = cmPols.$$array[i];
            for (let j = 0; j < arr.length; j++) {
                assert(typeof (arr[j]) === 'bigint', `pol: ${i} w: ${j} desc: ${JSON.stringify(cmPols.$$defArray[i], null, 1)}`);
            }
        }

        const res = await verifyPil(Fr, pil, cmPols, constPols);

        if (res.length !== 0) {
            // eslint-disable-next-line no-console
            console.log('Pil does not pass');
            for (let i = 0; i < res.length; i++) {
                // eslint-disable-next-line no-console
                console.log(res[i]);
            }
            assert(0);
        }
    });
});
