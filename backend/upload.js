const IncomingForm = require('formidable').IncomingForm;
const { Buffer } = require('buffer');
const fs = require('fs');
module.exports = function upload(req, res) {
    const form = new IncomingForm();

    form.on('file', (field, file) => {

        const rawData = fs.readFileSync(file.path);
        fs.writeFile(file.name, rawData, err => {
            if (err) {
                console.error(err)
            }
            res.end()
        })
        
        // Do something with the file
        // e.g. save it to the database
        // you can access it using file.path
    })
    form.on('end', () => res.json())
    form.parse(req)

}

