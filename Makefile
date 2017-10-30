test:
	echo 'starting server'; \
	python -m http.server 8000 &; \
	open http://localhost:8000/examples/nft_init_test.html; 


