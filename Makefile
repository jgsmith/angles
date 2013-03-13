SRC_DIR = src
TEST_DIR = tests
BUILD_DIR = build
COMPILED_DOCS_DIR = ${PREFIX}/compiled_docs

PREFIX = .
DIST_DIR = ${PREFIX}/dist

JS_ENGINE ?= `which node nodejs`
COMPILER = ${JS_ENGINE} ${BUILD_DIR}/uglify.js --unsafe
POST_COMPILER = ${JS_ENGINE} ${BUILD_DIR}/post-compile.js
DOCCO ?= `which docco-husky`
GRUNT ?= `which grunt`
COFFEE ?= `which coffee`

BASE_FILES = ${SRC_DIR}/angles-editor-view.coffee \
	${SRC_DIR}/validator.coffee

MODULES = ${SRC_DIR}/intro.coffee \
	${BASE_FILES} \
	${SRC_DIR}/outro.coffee

ANGLES = ${DIST_DIR}/angles.js
ANGLES_MIN = ${DIST_DIR}/angles.min.js
ANGLES_C = ${DIST_DIR}/angles.coffee

ANGLES_MAJOR = $(shell cat version.txt)
ANGLES_MINOR = $(shell date +%y%j)
N ?= 0

VER = sed "s/@VERSION/${ANGLES_MAJOR}.${ANGLES_MINOR}${N}/"

DATE=$(shell git log --pretty=format:%ad | head -1)

all: core

core: angles min test
	@@echo "angles build complete"

${DIST_DIR}:
	@@mkdir -p ${DIST_DIR}

${COMPILED_DOCS_DIR}/src:
	@@mkdir -p ${COMPILED_DOCS_DIR}/src

docs: ${MODULES} ${COMPILED_DOCS_DIR}/src README.md
	@@${DOCCO} ${SRC_DIR}

test: angles
	@@if test ! -z ${GRUNT}; then \
		echo "Testing angles"; \
		${COFFEE} -c ${TEST_DIR}; \
		${GRUNT} qunit; \
	else \
		echo "You must have grunt installed in order to test angles."; \
	fi

angles: ${ANGLES}

${ANGLES_C}: ${MODULES} ${DIST_DIR}
	@@echo "Building" ${ANGLES_C}
	@@rm -f ${ANGLES_C}.tmp
	@@for i in ${BASE_FILES}; do \
		cat $$i | sed 's/^/ /' >> ${ANGLES_C}.tmp; \
		echo >> ${ANGLES_C}.tmp; \
		done	
	@@cat ${SRC_DIR}/intro.coffee ${ANGLES_C}.tmp ${SRC_DIR}/outro.coffee | \
		sed 's/@DATE/'"${DATE}"'/' | \
		${VER} > ${ANGLES_C};
	@@rm -f ${ANGLES_C}.tmp;

${ANGLES}: ${ANGLES_C}
	@@${COFFEE} -c ${ANGLES_C}

min: angles ${ANGLES_MIN}

${ANGLES_MIN}: ${ANGLES}
	@@if test ! -z ${JS_ENGINE}; then \
		echo "Minifying angles" ${ANGLES_MIN}; \
		${COMPILER} ${ANGLES} > ${ANGLES_MIN}.tmp; \
		${POST_COMPILER} ${ANGLES_MIN}.tmp > ${ANGLES_MIN}; \
		rm -f ${ANGLES_MIN}.tmp; \
	else \
		echo "You must have NodeJS installed in order to minify angles."; \
	fi

clean:
	@@echo "Removing Distribution directory:" ${DIST_DIR}
	@@rm -rf ${DIST_DIR}
	@@echo "Removing compiled test scripts:" ${TEST_DIR}/*.js
	@@rm -f ${TEST_DIR}/*.js
	@@echo "Removing compiled documentation: " ${COMPILED_DOCS_DIR}
	@@rm -rf ${COMPILED_DOCS_DIR}

distclean: clean

.PHONY: all angles min clean distclean core