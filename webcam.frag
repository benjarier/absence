// Adapted from Glitch2 by Coolok https://www.shadertoy.com/view/4dXBW2
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vTexCoord;

uniform sampler2D tex0;
uniform vec2 iResolution;
uniform float iTime;
uniform float destroyProg;

float sat( float t ) {
	return clamp( t, 0.0, 1.0 );
}

vec2 sat( vec2 t ) {
	return clamp( t, 0.0, 1.0 );
}

//remaps inteval [a;b] to [0;1]
float remap  ( float t, float a, float b ) {
	return sat( (t - a) / (b - a) );
}

//note: /\ t=[0;0.5;1], y=[0;1;0]
float linterp( float t ) {
	return sat( 1.0 - abs( 2.0*t - 1.0 ) );
}

vec3 spectrum_offset( float t ) {
	vec3 ret;
	float lo = step(t,0.1);
	float hi = 1.0-lo;
	float w = linterp( remap( t, 1.0/6.0, 5.0/6.0 ) );
	float neg_w = 1.0-w;
    // ret = vec3(lo,0.0,hi);
    ret = vec3(lo,w,hi) * vec3(0.9);
    // ret= vec3(0.0);
	// ret = vec3(lo,1.0,hi) * vec3(neg_w, w, neg_w);
	// return pow( ret, vec3(1.0/50.0) );
    return ret;
}

//note: [0;1]
float rand( vec2 n ) {
  return fract(sin(dot(n.xy, vec2(12.9898, 78.233)))* 43758.5453);
}

//note: [-1;1]
float srand( vec2 n ) {
	return rand(n) * 2.0 - 1.0;
}

float mytrunc( float x, float num_levels )
{
	return floor(x*num_levels) / num_levels;
}
vec2 mytrunc( vec2 x, float num_levels )
{
	return floor(x*num_levels) / num_levels;
}

float moveY(float y){
	y*=100.0;
	y = floor(y);
	y /=100.0;
	float transY= rand(vec2(1.0, y));
	transY -= 0.5;
	transY = sign(transY);
	transY *= 0.8;
	transY = floor(transY);

	return transY;
}

void main()
{
	vec2 uv = vTexCoord;
    uv.y = 1.0 - uv.y;
	
	float time = mod(iTime*100.0, 32.0)/110.0;

	float GLITCH = 0.1;
	
	float gnm = sat( GLITCH );
	float rnd0 = rand( mytrunc( vec2(time, time), 6.0 ) );
	float r0 = sat((1.0-gnm)*0.7 + rnd0);
	float rnd1 = rand( vec2(mytrunc( uv.x, 10.0*r0 ), time) ); //horz
	float r1 = 0.5 - 0.5 * gnm + rnd1;
	r1 = 1.0 - max( 0.0, ((r1<1.0) ? r1 : 0.9999999) ); 
	float rnd2 = rand( vec2(mytrunc( uv.y, 40.0*r1 ), time) ); //vert
	float r2 = sat( rnd2 );

	float rnd3 = rand( vec2(mytrunc( uv.y, 10.0*r0 ), time) );
	float r3 = (1.0-sat(rnd3+0.8)) - 0.1;

	float pxrnd = rand( uv + time );

	float ofs = 0.05 * r2 * GLITCH * ( rnd0 > 0.5 ? 1.0 : -1.0 );
	ofs += 0.5 * pxrnd * ofs;

	uv.y += 0.1  * GLITCH;

    const int NUM_SAMPLES = 20;
    const float RCP_NUM_SAMPLES_F = 1.0 / float(NUM_SAMPLES);
    
	vec4 sum = vec4(0.0);
	vec3 wsum = vec3(0.0);
	for( int i=0; i<NUM_SAMPLES; ++i )
	{
		float t = float(i) * RCP_NUM_SAMPLES_F;
		uv.x = sat( uv.x + clamp(ofs*(1.0-destroyProg), -1.0, 1.0) *moveY(uv.y) * t );
		vec4 samplecol = texture2D(tex0, uv);
		vec3 s = spectrum_offset( t );
		samplecol.r = clamp(samplecol.r-destroyProg, 0.0, 1.0);
		samplecol.rgb = vec3(samplecol.r)* s * remap(moveY(uv.y), -4.0, 0.5);
		sum += samplecol;
		wsum += s;
	}
	sum.rgb /= wsum;
	sum.a *= RCP_NUM_SAMPLES_F;

	gl_FragColor.a = sum.a;
	gl_FragColor.rgb = sum.rgb; // * outcol0.a;
}

