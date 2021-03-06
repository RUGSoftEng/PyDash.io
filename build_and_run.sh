#!/bin/bash

ExportEnvironmentVars()
{
  export FLASK_APP=pydash.py
  export FLASK_ENV=development
  export FMD_CONFIG_PATH=fmd_config.cfg
}

PydashPrint()
{
    echo -e '\e[1m\e[92m[PyDash.io]: \e[0m\e[1m' "$1" '\e[0m'
}

BuildFrontend()
{
    PydashPrint "building frontend..."
    cd pydash-front
    yarn
    yarn build
    cd ..
    PydashPrint "Done!"
}

BuildBackend()
{
    PydashPrint "building backend..."
    cd pydash
    mkdir -p logs
    pipenv install
    cd ..
    PydashPrint "Done!"
}

SeedBackend()
{
    PydashPrint "seeding backend..."
    cd pydash
    mkdir -p logs
    ExportEnvironmentVars
    #rm -f ./zeo_filestorage.fs*
    pipenv run flask seed
    cd ..
    PydashPrint "Done!"
}

RunDatabase()
{
    PydashPrint "Starting database in background..."
    cd pydash
    pipenv run "./start_database.sh" &
    cd ..
    PydashPrint "Done!"
}

RunDatabaseForeground()
{
    PydashPrint "Starting database in foreground..."
    cd pydash
    pipenv run "./start_database.sh"
    cd ..
    PydashPrint "Done!"
}

RunFlask()
{
    PydashPrint "Starting flask webservice. Close with Ctrl+C"
    cd pydash
    ExportEnvironmentVars
    pipenv run flask run --no-reload --host=0.0.0.0
    cd ..
}

RunFlaskConsole()
{
    PydashPrint "Starting flask webservice as shell."
    cd pydash
    ExportEnvironmentVars
    pipenv run flask shell
    cd ..

}

RunFrontend()
{
    cd pydash-front
    yarn start
    cd ..
    PydashPrint "Done!"
}

RunTests()
{
    cd pydash
    ExportEnvironmentVars
    pipenv run pytest
    cd ..
    PydashPrint "Done!"
}

BuildDocumentation()
{
    RunDatabase
    PydashPrint "Starting Backend Documentation generation"
    cd pydash/sphinx_docs
    pipenv run make latexpdf
    cd ../..
    cp ./pydash/sphinx_docs/_build/latex/PyDash.pdf ./docs/PyDashDocumentation.pdf
    PydashPrint "Resulting Backend Documentation PDF can be found in ./docs/PyDashDocumentation.pdf"
    killall runzeo

    PydashPrint "Starting Frontend Documentation generation"
    cd pydash-front
    yarn doc
    sed -i.bak 's/-----/\n\n/g' DOCUMENTATION.md
    sed -i.bak 's/1. //g' DOCUMENTATION.md
    sed -i.bak 's/^Components//g' DOCUMENTATION.md
    sed -i '1i # PyDash Front-end Components Documentation \n\n\n' DOCUMENTATION.md
    pandoc DOCUMENTATION.md -o PyDashFrontDocumentation.pdf
    cd ..
    cp ./pydash-front/PyDashFrontDocumentation.pdf ./docs/PyDashFrontDocumentation.pdf
    PydashPrint "Resulting Frontend Documentation PDF can be found in ./docs/PyDashFrontDocumentation.pdf"

    PydashPrint "Done!"
    PydashPrint "Documentation files in ./docs updated!"


}

RunProduction()
{
    PydashPrint "Starting Production Server..."
    export FLASK_DEBUG=0;
    export FLASK_ENV=production;
    export ENV=production;
    RunDatabase
    RunFlask
}


if [ $# -gt 0 ];
then
    for i in "$@";
    do
        if [ $i == "seed" ];
        then
            SeedBackend
        fi
        if [ $i == "build" ];
        then
            BuildFrontend
            BuildBackend
        fi
        if [ $i == "database" ];
        then
            RunDatabaseForeground
        fi
        if [ $i == "databasebg" ];
        then
            RunDatabase
        fi
        if [ $i == "production" ];
        then
            RunProduction
        fi
        if [ $i == "server" ];
        then
            xdg-open "http://localhost:5000" &
            RunFlask
        fi
        if [ $i == "frontend" ];
        then
            RunFrontend
        fi
        if [ $i == "test" ];
        then
            RunTests
        fi
        if [ $i == "shell" ];
        then
            RunFlaskConsole
        fi
        if [ $i == "documentation" ];
        then
            BuildDocumentation
        fi
    done;
    PydashPrint "Done! Goodbye :-)"
else
    ./$0 build databasebg server
fi
